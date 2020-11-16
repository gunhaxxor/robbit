import { Component, ElementRef, HostListener, ViewChild } from "@angular/core";
import {
  NavController,
  AlertController,
  NavParams,
  Platform,
  PopoverController,
  LoadingController
} from "ionic-angular";
import { EmojiPage } from "../emoji-page/emoji-page";
import { SettingsPage } from "../settings-page/settings-page";
// import { BleService } from "../../providers/bleservice/bleService";
// import { Socket } from "ng-socket-io";
import { SocketIOService } from '../../providers/socketioservice/socketioService';
import * as Peer from "simple-peer";
import nipplejs from "nipplejs";
// import { Camera } from "@ionic-native/camera";
import { Diagnostic } from "@ionic-native/diagnostic";
// import "webrtc-adapter";
import "zone.js/dist/webapis-rtc-peer-connection";
import "zone.js/dist/zone-patch-user-media";
// import encoding from 'text-encoding';

declare var CommandBot: any;

@Component({
  selector: "page-driverInterface",
  templateUrl: "driverInterface.html"
})
export class DriverInterfacePage {
  peer: any;
  connectionType: string = "";
  peerLinkActive: boolean = false;
  videoLinkWaitingForAnswer = false;
  initiateCallTimeout: any;
  localVideoTag: HTMLVideoElement;
  localVideoTrack: any;
  localAudioTrack: any;
  remoteStream: MediaStream;
  remoteVideoTag: HTMLVideoElement;
  showCamera: boolean;
  muteAudio: boolean;
  currentEmoji: string = "🙂";
  robotControlIntervalId: any;
  forwardActive: boolean;
  reverseActive: boolean;
  robotThrottle: number = 0;
  robotRotation: number = 0;
  servoAngleChange: number = 0;
  isParked: boolean = false;
  isWaving: boolean = false;
  SERVO_START_VALUE: number = 65;
  SERVO_MAX_VALUE: number = 100;
  SERVO_MIN_VALUE: number = 20;
  ROBOT_MOTOR_MAX_THROTTLE: number = 1000;
  DRIVE_MOTOR_SCALE: number = 0.3;
  TURN_MOTOR_SCALE: number = 0.3;
  servoAngle: number = this.SERVO_START_VALUE;
  SERVO_SCALE: number = 5;
  robotName: string;
  attentionSound: any;
  chatSound: any;
  chatSoundEnabled: boolean = true;

  videoVerticalFlipped: boolean = false;
  chat: any = { text: "", previousMessage: "", isShown: false, timeoutSeconds: null };
  chatTimeout: any; //a reference to the most recent timeout function
  defaultMessageTimeout: any = 60;  //seconds
  bot: any;
  voiceControlEnabled: boolean = false;
  voiceDriveTimeout: any;
  voiceDriveIntervalMillis: number = 200;
  voiceDriveTimeoutMillis: number = 2000;
  voiceRotateTimeoutMillis: number = 1000;
  voiceRecognitionState: number = -1;
  @ViewChild("chatInput") chatInput: ElementRef;

  constructor(
    public platform: Platform,
    public navCtrl: NavController,
    private alertCtrl: AlertController,
    public loading: LoadingController,
    public navParams: NavParams,
    // public bleService: BleService,
    // private socket: Socket,
    private socketIOService: SocketIOService,
    // private camera: Camera,
    private diagnostic: Diagnostic,
    public popoverEmojiCtrl: PopoverController,
    public popoverSettingsCtrl: PopoverController
  ) { }

  @HostListener("window:beforeunload", ["$event"])
  handler(event: Event) {
    console.log("beforeunload-event triggered");
    event.returnValue = false;
  }

  //user is leaving the selected page.
  ionViewDidLeave() {
    this.peerLinkActive = false;
  }

  ionViewWillLeave() {
    console.log("will leave driver interface page. Cleaning up som shit");
    this.socketIOService.socket.emit("leave", this.robotName);
    console.log(this.socketIOService.socket.listeners("robotControl"));
    console.log(this.socketIOService.socket.listeners("signal"));
    console.log(this.socketIOService.socket.listeners("room"));

    this.socketIOService.socket.off("robotControl");
    this.socketIOService.socket.off("signal");
    this.socketIOService.socket.off("room");

    console.log(this.socketIOService.socket.listeners("robotControl"));
    console.log(this.socketIOService.socket.listeners("signal"));
    console.log(this.socketIOService.socket.listeners("room"));
    clearInterval(this.robotControlIntervalId);
    if (this.peer) {
      this.peer.destroy();
    }
    delete this.peer;
  }

  ionViewDidEnter() {
    this.robotName = this.navParams.get("robotName");
    this.localVideoTag = document.querySelector("#driver-local-video");
    this.remoteVideoTag = document.querySelector("#driver-remote-video");

    if (this.socketIOService.socket.connected) {
      console.log("socket was already connected. Trying to join room");
      this.socketIOService.socket.emit("join", this.robotName);
    } else {
      this.socketIOService.socket.on("connect", () => {
        console.log("socket connected event. Trying to join room");
        this.socketIOService.socket.emit("join", this.robotName);
      });
    }

    let roomJoined: Promise<{}> = new Promise((resolve, reject) => {
      this.socketIOService.socket.on("room", msg => {
        console.log("room message from server:" + JSON.stringify(msg));
        if (msg.room == this.robotName && msg.joined) {
          console.log("attaching socket events");
          this.socketIOService.socket.on("robotControl", msg => {
            console.log("received socket msg: " + JSON.stringify(msg));
            // this.bleService.send(msg);
          });

          this.socketIOService.socket.on("signal", data => {
            console.log("Driver received signal message from socket");
            console.log(data);

            if (this.peer) {
              this.peer.signal(data);
            }
          });
        }
        resolve();
      });
    });

    this.socketIOService.socket.on("message", msg => {
      console.log("message from socket server: " + msg);
    });

    this.socketIOService.socket.on("error", msg => {
      console.error("error message from socket server: " + msg);
    });

    let cameraRetrieved = this.retrieveCamera();
    // let cameraRetrieved = this.checkNeededPermissions().then(() => {
    //   return this.retrieveCamera();
    // }).catch((err) => console.log("failed to get permissions: " + err));
    // console.log(cameraRetrieved);

    Promise.all([roomJoined, cameraRetrieved])
      .then(values => {
        console.log("setup promises resolved. Inititating call!");
        this.initiateCall(values[1]);
      })
      .catch(err => {
        console.error("FAILED TO SETUP ALL THE STUFFZ! NOW CRY!!!");
        console.error(err);
      });

    // Let's divide the motorvariables into drive and look components.
    this.robotThrottle = 0;
    this.robotRotation = 0;
    this.servoAngleChange = 0;
    let options = {
      zone: document.getElementById("zone-joystick"),
      mode: "static",
      position: { right: "70%", top: "50%" },
      color: "white",
      size: 150
    };

    let manager = nipplejs.create(options);

    manager
      .on("move", (evt, data) => {
        if (data.angle) {
          // // px, py are between max distance and -1 * max distans

          let px = Math.cos(data.angle.radian) * data.distance;
          let py = Math.sin(data.angle.radian) * data.distance;

          console.log("px: " + px);
          console.log("py: " + py);
          let joystickMaxDistance = options.size / 2;

          let x = px / joystickMaxDistance;
          let y = py / joystickMaxDistance;

          this.robotRotation = x;
          this.servoAngleChange = y;

          // Source of algorithm:
          // http://home.kendra.com/mauser/Joystick.html
          // Calculate R+L (Call it V): V =(100-ABS(X)) * (Y/100) + Y
          // let v =
          //   (JOYSTICK_MAX_DIST - Math.abs(px)) * (py / JOYSTICK_MAX_DIST) +
          //   py;
          // // Calculate R-L (Call it W): W= (100-ABS(Y)) * (X/100) + X
          // let w =
          //   (JOYSTICK_MAX_DIST - Math.abs(py)) * (px / JOYSTICK_MAX_DIST) +
          //   px;
          // Calculate R: R = (V+W) /2
          // rightMotor = (v + w) / 2;
          // // Calculate L: L= (V-W)/2
          // leftMotor = (v - w) / 2;
          // // Do any scaling on R and L your hardware may require.
          // rightMotor *= MOTOR_SCALE;
          // leftMotor *= MOTOR_SCALE;

          // // Send those values to your Robot.
          // console.log(" leftMotor:" + leftMotor + "rightMotor:" + rightMotor);
        }
      })
      .on("end", (evt, nipple) => {
        this.robotRotation = 0;
        this.servoAngleChange = 0;
        console.log("joystick released");
      });

    //TODO: Send robotcontrol over RTCPDatachannel? As of now we're using the signaling socket. meh...
    this.robotControlIntervalId = setInterval(() => {
      if (!this.peerLinkActive) {
        //console.log("Not sending anything because we have no connection.");
        return;
      }

      if (this.forwardActive) {
        this.robotThrottle =
          this.ROBOT_MOTOR_MAX_THROTTLE * this.DRIVE_MOTOR_SCALE;
      } else if (this.reverseActive) {
        this.robotThrottle =
          -this.ROBOT_MOTOR_MAX_THROTTLE * this.DRIVE_MOTOR_SCALE;
      } else {
        this.robotThrottle = 0;
      }

      let rotationMotorAdjustment =
        this.robotRotation *
        this.ROBOT_MOTOR_MAX_THROTTLE *
        this.TURN_MOTOR_SCALE; // -20 to +20

      let leftMotor = this.robotThrottle + rotationMotorAdjustment;
      let rightMotor = this.robotThrottle - rotationMotorAdjustment;

      //Section for constraining motor values within max allowed throttle
      let ratio = 1;
      if (
        Math.abs(leftMotor) > this.ROBOT_MOTOR_MAX_THROTTLE ||
        Math.abs(rightMotor) > this.ROBOT_MOTOR_MAX_THROTTLE
      ) {
        ratio =
          this.ROBOT_MOTOR_MAX_THROTTLE /
          Math.max(Math.abs(leftMotor), Math.abs(rightMotor));
      }
      leftMotor *= ratio;
      rightMotor *= ratio;

      let leftMotorFloored = Math.floor(leftMotor);
      let rightMotorFloored = Math.floor(rightMotor);

      this.servoAngle -= this.servoAngleChange * this.SERVO_SCALE;
      this.servoAngle = Math.max(
        this.SERVO_MIN_VALUE,
        Math.min(this.SERVO_MAX_VALUE, this.servoAngle)
      );
      let servoFloored = Math.floor(this.servoAngle);
      // if (turnAmt == 0) {
      //   motorValue1 = forwardAmt;
      //   motorValue2 = forwardAmt;
      // } else {
      //   motorValue1 = forwardAmt / 2 + turnAmt / 2;
      //   motorValue2 = forwardAmt / 2 - turnAmt / 2;
      // }

      let msg =
        "" +
        leftMotorFloored +
        "," +
        rightMotorFloored +
        "," +
        servoFloored +
        "\n";
      console.log("sending robot data to socket: " + msg);
      this.socketIOService.socket.emit("robotControl", msg);
    }, 300);

    if (this.voiceControlEnabled) {
      this.setupSpeechRecognition();
    }

    this.attentionSound = new Audio();
    this.attentionSound.src = "assets/sound/kickhat-open-button-2.mp3";
    this.attentionSound.load();
    this.chatSound = new Audio();
    this.chatSound.src = "assets/sound/ertfelda-correct.mp3";
    this.chatSound.load();
  }

  @HostListener("document:keydown", ["$event"])
  @HostListener("document:keyup", ["$event"])
  handleKeyboardEvent(event: KeyboardEvent) {
    // console.log("key down:"+event.key);

    //Bail out if we're in the chat box
    if (document.activeElement.className.includes("text-input")) {
      return;
    }

    if (event.type == "keydown") {
      switch (event.key) {
        case "ArrowUp":
          if (this.peerLinkActive) {
            this.servoAngleChange = 1;
          }
          break;
        case "ArrowDown":
          if (this.peerLinkActive) {
            this.servoAngleChange = -1;
          }
          break;
        case "ArrowLeft":
          if (this.peerLinkActive) {
            this.robotRotation = -1;
          }
          break;
        case "ArrowRight":
          if (this.peerLinkActive) {
            this.robotRotation = 1;
          }
          break;
        case "a":
          if (!this.isParked) {
            this.forwardActive = true;
          }
          break;
        case "z":
          if (!this.isParked) {
            this.reverseActive = true;
          }
          break;
        case "i":
          this.presentSettingsPopover(undefined);
          break;
        case "e":
          if (!this.showCamera) {
            this.presentEmojiPopover(undefined);
          }
          break;
        case "k":
          this.toggleVideoTrack();
          break;
        case "m":
          this.toggleAudioTrack();
          break;
        case "r":
          if (this.peerLinkActive) {
            this.toggleWaving();
          }
          break;
      }
    } else if (event.type == "keyup") {
      switch (event.key) {
        case "a":
          this.forwardActive = false;
          break;
        case "z":
          this.reverseActive = false;
          break;
        case "ArrowLeft":
          this.robotRotation = 0;
          break;
        case "ArrowRight":
          this.robotRotation = 0;
          break;
        case "ArrowUp":
          this.servoAngleChange = 0;
          break;
        case "ArrowDown":
          this.servoAngleChange = 0;
          break;
        // case "Escape":
        //   console.log('Escape was pressed!!!!');
        //   this.chatInput["_native"].nativeElement.blur();
        //   break;
      }
    }
  }

  // Make sure this won't get called before we have retrieved local media and joined the correct socket room!
  initiateCall(stream) {
    console.log("starting call as initiator");
    // make sure we won't let a set timer roam free before we create a new one.
    // makes no sense when I think about it...
    // if (this.initiateCallTimeout != undefined) {
    //   console.log("There was already a timeout set. Clearing it.");
    //   clearInterval(this.initiateCallTimeout);
    // }
    this.initiateCallTimeout = setTimeout(() => {
      this.tearDownPeer();
      this.initiateCall(stream);
    }, 10000);
    this.videoLinkWaitingForAnswer = true;
    // let peerConfig = JSON.parse(process.env.PEER_CONFIG);
    let peerConfig = {
      "iceServers": [
        { "urls": `stun:${process.env.BACKEND_SERVER}:${process.env.TURN_UDP_PORT}` },
        { "urls": `turn:${process.env.BACKEND_SERVER}:${process.env.TURN_UDP_PORT}`, "username": process.env.TURN_USER, "credential": process.env.TURN_PASSWORD }]
    }
    console.log(peerConfig);

    //default to not show video!!!!!
    if (stream.getVideoTracks().length > 0) {
      // this.localStream.removeTrack(this.localStream.getVideoTracks()[0]);
      this.localVideoTrack.enabled = false;
    }

    // this.localAudioTrack.enable = false;

    this.peer = new Peer({
      initiator: true,
      stream: stream,
      config: peerConfig,
      offerOptions: { offerToReceiveVideo: true }
    });
    // this.localStream.addTrack(this.localVideoTrack);
    console.log("peer object is:");
    console.log(this.peer);
    this.peer.on("signal", data => {
      console.log(
        "Driver got signal data locally. Passing it on to signaling server"
      );
      this.socketIOService.socket.emit("signal", data);
    });
    this.peer.on("stream", stream => {
      console.log(
        "I am Driver and I am initiator. Received stream from listening peer"
      );
      // got remote video stream, now let's show it in a video tag
      this.remoteVideoTag.srcObject = stream;
      // video.play();
    });
    this.peer.on("connect", () => {
      clearTimeout(this.initiateCallTimeout);
      console.log("peer connected event");
      console.log("peer object is:");
      console.log(this.peer);
      this.peerLinkActive = true;
      this.videoLinkWaitingForAnswer = false;

      this.checkConnectionType();

      // this.removeVideoTrack(); // disable video as default
      this.sendEmoji(this.currentEmoji);
      this.clearChatBubble();
    });
    this.peer.on("track", (track, stream) => {
      console.log("remote track added: ", track);
      console.log("stream is: ", stream);

      ///*********************************************************************************** */
      ///  Ugly hack necessary because webrtc doesn't seem to allow caller to receive video without offering it.
      ///  So we start with offering empty video (enabled = false).
      ///  Then when link is established here we remove that track....
      if (!this.getOutboundStream().getVideoTracks()[0].enabled) {
        console.log("removing videotrack that was disabled");
        this.removeVideoTrack();
        this.getOutboundStream().getVideoTracks()[0].enabled = true; // we enable it directly after it's removed from the outgoing stream so it stops showing black pixels
        this.localVideoTrack.enabled = true;
      }
    });

    // TODO: Proper shutdown of connection. Including sockets and all of that...
    this.peer.on("close", () => {
      console.log("peer connection closed");
      console.log("this.peer: " + this.peer);
      // this.peer.destroy();
      // delete this.peer;
      this.peerLinkActive = false;
      this.videoLinkWaitingForAnswer = false;
    });
    // this.peer.on('unhandledRejection', (reason, p) => {
    //   console.log("!! unhandledRejection " + reason + " " + p);
    // });
    // this.peer.on('uncaughtException', err => {
    //   // HANDLE ERROR HERE
    //   console.log("!! uncaughtException " + err);
    // });
    this.peer.on("error", err => {
      console.error("!! error " + err);
    });
    this.peer.on("data", msg => {
      let msgObj = JSON.parse(String(msg));

      if (msgObj.hasOwnProperty("endcall") && msgObj.endcall) {
        console.log("Received endcall.");
        // this.zone.run(() => {
        // because we are in a callback this would have happened outside angulars zone
        // which wouldn't update the template
        // that's why we force it to run inside the zone
        // and update the interface instantly
        this.tearDownPeer();
        this.navCtrl.pop();
        // });
      }

      if (msgObj.hasOwnProperty("isParked")) {
        this.isParked = msgObj.isParked;
        console.log(this.isParked);
      }
    });
  }

  hangUp() {
    let alert = this.alertCtrl.create({
      title: "Avsluta samtal",
      message: "Vill du lägga på?",
      buttons: [
        {
          text: "Stanna",
          role: "cancel",
          handler: () => {
            console.log("Cancel clicked");
          }
        },
        {
          text: "Avsluta",
          handler: () => {
            console.log("Exit confirmed");
            clearInterval(this.initiateCallTimeout);
            this.sendData({ endcall: true });
            this.tearDownPeer();
            this.navCtrl.pop();
          }
        }
      ]
    });
    alert.present();
  }

  tearDownPeer() {
    this.peerLinkActive = false;
    if (this.peer) {
      // This was an effort to make the browser release the camera when returning to home screen. Doesn't seem to work though...
      // if (this.localStream && this.localStream.getTracks) {
      //   console.log("stopping all mediatracks on localstream");
      //   this.localStream.getTracks().forEach(track => track.stop());
      //   // for (let track of tracks) {
      //   //   track.stop();
      //   // }
      //   this.localVideoTag.srcObject = null;

      //   if (this.localStream.stop) {
      //     console.log("calling this.localStream.stop()");
      //     this.localStream.stop();
      //   }
      //   this.localStream = null;
      // }
      // if (this.remoteStream && this.remoteStream.getTracks) {
      //   console.log('stopping all mediatracks on remotestream');
      //   let tracks = this.remoteStream.getTracks();
      //   for (let track of tracks) {
      //     track.stop();
      //   }
      //   this.remoteStream = null;
      // }

      console.log("destroying peer object");
      this.peer.destroy();
      this.peer = null;
    }
  }

  // changeCamera() {
  //   if (this.cameraOption == "environment") {
  //     this.cameraOption = "user";
  //   } else {
  //     this.cameraOption = "environment";
  //   }
  //   // let video: HTMLVideoElement = document.querySelector("#driver-local-video");

  //   this.localVideoTag.pause();
  //   this.retrieveCamera();
  // }

  toggleVideoTrack() {
    this.showCamera = !this.showCamera;
    if (this.showCamera) {
      this.addVideoTrack();
    } else {
      this.removeVideoTrack();
    }
  }

  removeVideoTrack() {
    console.log("removing video track from stream", this.peer);
    // if (!this.localStream) {
    //   console.log(
    //     "this.localStream is undefined. Can't remove it's (video)track"
    //   );
    //   return;
    // }
    // let videoTracks = this.localStream.getVideoTracks();
    // this.localVideoTrack = this.localStream.getVideoTracks()[0];
    // if (videoTracks.length == 0) {
    //   console.log("No video tracks found on local stream");
    //   return;
    // }
    // console.log("Found these video tracks in localStream:", videoTracks);

    if (this.peer != null) {
      this.peer.removeTrack(this.localVideoTrack, this.getOutboundStream());
      // this.localStream.removeTrack(this.localVideoTrack);
    }
    this.showCamera = false;
    this.sendData({ showDriverCamera: this.showCamera });
    console.log("Video track removed from stream.");
  }

  addVideoTrack() {
    if (!this.peer) {
      return;
    }
    // if (!this.localStream) {
    //   console.error(
    //     "this.localStream is undefined. Can't add (video)track to it"
    //   );
    //   return;
    // }
    if (!this.localVideoTrack) {
      console.error("no local video track defined. Can't add it to the stream");
      return;
    }

    console.log(
      "adding video track to stream:",
      this.localVideoTrack,
      this.peer
    );
    if (this.peer != null) {
      if (!this.getOutboundStream().getVideoTracks()[0].enabled) {
        console.log(
          "there was an disabled track in the stream. Trying to enable it"
        );
        this.getOutboundStream().getVideoTracks()[0].enabled = true;
      } else {
        this.peer.addTrack(this.localVideoTrack, this.getOutboundStream());
      }
    }
    this.showCamera = true;
    this.sendData({ showDriverCamera: this.showCamera });

    console.log("video track added to stream.");
  }

  toggleAudioTrack() {
    this.muteAudio = !this.muteAudio;
    if (this.muteAudio) {
      this.removeAudioTrack();
    } else {
      this.addAudioTrack();
    }
  }

  removeAudioTrack() {
    if (!this.peer) {
      return;
    }
    // if (!this.localStream) {
    //   console.error(
    //     "this.localStream is undefined. Can't remove track from it"
    //   );
    //   return;
    // }
    let audioTracks = this.getOutboundStream().getAudioTracks();
    if (audioTracks.length == 0) {
      console.log("No audio tracks found on local stream");
      return;
    }

    // if (this.peer != null) {
    this.peer.removeTrack(audioTracks[0], this.getOutboundStream());
    // }
    this.muteAudio = true;
    this.sendData({ muteDriver: this.muteAudio });
    console.log("audio track removed from stream.");
  }

  addAudioTrack() {
    if (!this.peer) {
      return;
    }
    // if (!this.localStream) {
    //   console.error("this.localStream is undefined. Can't add track to it");
    //   return;
    // }
    if (!this.localAudioTrack) {
      console.error("no local audio track defined. Can't add it to the stream");
      return;
    }

    // if (this.peer != null) {
    this.peer.addTrack(this.localAudioTrack, this.getOutboundStream());
    // }
    this.muteAudio = false;
    this.sendData({ muteDriver: this.muteAudio });
    console.log("audio track added to stream.");
  }

  retrieveAudio() {
    console.log("retrieving microphone!");
    return navigator.mediaDevices
      .getUserMedia({
        video: false,
        audio: true
      })
      .then(stream => {
        console.log("Driver got local media as a stream");
        // this.localStream = stream;

        this.localAudioTrack = stream.getAudioTracks()[0];
        // this.localVideoTag.srcObject = this.localStream;
        // this.localVideoTag.volume = 0;
        // video.play();
        this.showCamera = false;
        this.muteAudio = false;

        return stream;
      })
      .catch(err => {
        console.log("error: " + err);
        return Promise.reject(err);
      });
  }

  retrieveCamera() {
    // get video/voice stream
    console.log("retrieving camera!");
    return navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true
      })
      .then(stream => {
        console.log("Driver got local media as a stream");
        // this.localStream = stream;
        // let video: HTMLVideoElement = document.querySelector("#driver-local-video");
        this.localVideoTrack = stream.getVideoTracks()[0];
        //below check is for chrome 58 or older
        if (
          this.localVideoTrack.label !== "Screen" &&
          this.localVideoTrack.readyState === "ended"
        ) {
          console.error(
            "Some problem when retrieving camera. It's readystate is 'ended'. Is it in use by another software?"
          );
        }
        this.localAudioTrack = stream.getAudioTracks()[0];
        this.localVideoTag.srcObject = stream;
        this.localVideoTag.volume = 0;
        // video.play();
        this.showCamera = false;
        this.muteAudio = false;

        return stream;
      })
      .catch(err => {
        console.log("error: " + err);
        return Promise.reject(err);
      });
  }

  presentEmojiPopover(myEvent) {
    let popover = this.popoverEmojiCtrl.create(EmojiPage);
    popover.present({
      ev: myEvent
    });
    popover.onDidDismiss(text => {
      if (text == null) {
        return;
      }
      this.currentEmoji = text;
      this.sendEmoji(text);
    });
  }

  sendEmoji(text: String) {
    this.sendData({ emoji: text });
  }

  presentSettingsPopover(myEvent) {
    let popover = this.popoverSettingsCtrl.create(SettingsPage, {
      driverPage: () => {
        return this;
      }
    });
    popover.present({
      ev: myEvent
    });
    popover.onDidDismiss(text => {
      if (text == null) {
        return;
      }
    });
  }

  clearChatBubble() {
    this.chat.isShown = false;
    // this.sendData({
    //   chat: { text: this.chat.previousMessage, isShown: this.chat.isShown }
    // });
  }

  sendClearChatBubble() {
    this.clearChatBubble();
    this.sendData({
      chat: { clear: true }
    });
  }

  sendChat() {
    if (this.chat.text === "") {
      return;
    }
    console.log("sending chat");
    console.log(this.chat.text);
    if (this.chatSoundEnabled) {
      this.chatSound.play();
    }
    this.chat.isShown = true;
    this.sendData({ chat: this.chat });
    this.chat.previousMessage = this.chat.text;
    this.chat.text = "";
    // this is a rather ugly way of calling blur(onfocus) on the textfield
    // but we want to close the smartphone keyboard
    // This is an issue with the driver app running on tablets
    // See https://github.com/ionic-team/ionic/issues/14130
    // this.chatInput["_native"].nativeElement.blur();


    //Always allow more typing into the input!
    this.chatInput["_native"].nativeElement.focus();

    // if (this.chat.previousMessage != "") {
    if (this.chatTimeout) {
      clearTimeout(this.chatTimeout);
    }
    this.chatTimeout = setTimeout(() => {
      this.clearChatBubble();
    }, this.chat.timeoutSeconds ? this.chat.timeoutSeconds * 1000 : this.defaultMessageTimeout * 1000);
  }

  sendData(sendObj: object) {
    // console.log('Sending data over datachannel (webrtc)');
    if (this.peer != null && this.peerLinkActive) {
      try {
        this.peer.send(JSON.stringify(sendObj));
      } catch (err) {
        console.log("Error while trying to send data:");
        console.log(err);
      }
    } else {
      console.log(
        "no peer or peerLinkActive. Won't send any RTC-datachannel stuff"
      );
    }
  }

  checkNeededPermissions() {
    // let returnPromise = new Promise();
    if (
      this.diagnostic.isCameraAuthorized(false) &&
      this.diagnostic.isMicrophoneAuthorized()
    ) {
      return Promise.resolve();
    }
    return Promise.reject("Camera and mic authorization promise rejected!");
  }

  toggleParking() {
    this.isParked = !this.isParked;
    this.sendData({ isParked: this.isParked });
  }

  toggleWaving() {
    this.isWaving = !this.isWaving;
    this.sendData({ isWaving: this.isWaving });
    if (this.isWaving) {
      this.attentionSound.play();
    }
  }

  setupSpeechRecognition() {
    console.log("Initiating speech recognition.");

    if (!this.bot) {
      this.bot = new CommandBot();
      this.bot.setLanguageRecognition("sv-SE");
      this.bot.setKeyword("Robot");
      this.bot.setNoKeywordMode(false);
      this.bot.setKeywordRecognised(() => {
        this.voiceRecognitionState = 1;
      });
      this.bot.setCommandRecognised(() => {
        this.voiceRecognitionState = 2;
        setTimeout(() => {
          this.voiceRecognitionState = 0;
        }, 1000);
      });
      this.bot.setNoCommandRecognised(() => {
        this.voiceRecognitionState = 3;
        setTimeout(() => {
          this.voiceRecognitionState = 0;
        }, 1000);
      });

      this.bot.addCommand("who are you", () => {
        console.log("I am your personal robot.");
      });
      this.bot.addCommand("kör framåt", () => {
        clearInterval(this.voiceDriveTimeout);
        this.drive(1, 1, false);
        this.voiceDriveTimeout = setInterval(() => {
          this.drive(1, 1, false);
        }, this.voiceDriveIntervalMillis);
        setTimeout(() => {
          clearInterval(this.voiceDriveTimeout);
        }, this.voiceDriveTimeoutMillis);
      });
      this.bot.addCommand("kör bakåt", () => {
        clearInterval(this.voiceDriveTimeout);
        this.drive(-1, -1, false);
        this.voiceDriveTimeout = setInterval(() => {
          this.drive(-1, 1, false);
        }, this.voiceDriveIntervalMillis);
        setTimeout(() => {
          clearInterval(this.voiceDriveTimeout);
        }, this.voiceDriveTimeoutMillis);
      });
      this.bot.addCommand("vänster", () => {
        clearInterval(this.voiceDriveTimeout);
        this.drive(-1, 1, true);
        this.voiceDriveTimeout = setInterval(() => {
          this.drive(-1, 1, true);
        }, this.voiceDriveIntervalMillis);
        setTimeout(() => {
          clearInterval(this.voiceDriveTimeout);
        }, this.voiceRotateTimeoutMillis);
      });
      this.bot.addCommand("höger", () => {
        clearInterval(this.voiceDriveTimeout);
        this.drive(1, -1, true);
        this.voiceDriveTimeout = setInterval(() => {
          this.drive(1, -1, true);
        }, this.voiceDriveIntervalMillis);
        setTimeout(() => {
          clearInterval(this.voiceDriveTimeout);
        }, this.voiceRotateTimeoutMillis);
      });
      this.bot.addCommand("stopp", () => {
        clearInterval(this.voiceDriveTimeout);
      });
      this.bot.addCommand("titta upp", () => {
        this.angleChange(5);
      });
      this.bot.addCommand("titta ner", () => {
        this.angleChange(-5);
      });
      this.bot.addCommand("räck upp handen", () => {
        this.toggleWaving();
      });
      this.bot.addCommand("ta ner handen", () => {
        this.isWaving = false;
      });
      this.bot.addCommand("avsluta", () => {
        this.navCtrl.pop();
      });
      // this.bot.addCommand("ring upp", () => {
      //   this.initiateCall();
      // });
      this.bot.addCommand("video", () => {
        this.toggleVideoTrack();
      });
      this.bot.addCommand("mikrofon", () => {
        this.toggleAudioTrack();
      });
      // this.bot.addCommand("lyssna", ()=>{
      //   this.bot.setNoKeywordMode(true);
      // });
      // this.bot.addCommand("lyssna inte", ()=>{
      //   this.bot.setNoKeywordMode(false);
      // });
    }

    this.bot.run();
    this.voiceRecognitionState = 0;
  }

  setVoiceControl() {
    if (this.voiceControlEnabled) {
      console.log("starting voice control");

      this.setupSpeechRecognition();
    } else {
      console.log("stopping voice control");
      this.bot.stop();
    }
  }

  drive(leftMotor: number, rightMotor: number, isRotation: boolean) {
    let leftMotorFloored = 0;
    let rightMotorFloored = 0;

    if (isRotation) {
      let robotRotation = 1.0;
      let rotationMotorAdjustment =
        robotRotation * this.ROBOT_MOTOR_MAX_THROTTLE * this.TURN_MOTOR_SCALE; // -20 to +20

      leftMotorFloored = Math.floor(leftMotor * rotationMotorAdjustment);
      rightMotorFloored = Math.floor(rightMotor * rotationMotorAdjustment);
    } else {
      leftMotorFloored = Math.floor(
        leftMotor * this.ROBOT_MOTOR_MAX_THROTTLE * this.DRIVE_MOTOR_SCALE
      );
      rightMotorFloored = Math.floor(
        rightMotor * this.ROBOT_MOTOR_MAX_THROTTLE * this.DRIVE_MOTOR_SCALE
      );
    }
    let servoFloored = Math.floor(this.servoAngle);
    let msg =
      "" +
      leftMotorFloored +
      "," +
      rightMotorFloored +
      "," +
      servoFloored +
      "\n";
    console.log("sending robot data to socket: " + msg);
    this.socketIOService.socket.emit("robotControl", msg);
  }

  angleChange(servoAngleChange) {
    let leftMotorFloored = 0;
    let rightMotorFloored = 0;
    this.servoAngle += servoAngleChange * this.SERVO_SCALE;
    this.servoAngle = Math.max(
      this.SERVO_MIN_VALUE,
      Math.min(this.SERVO_MAX_VALUE, this.servoAngle)
    );
    let servoFloored = Math.floor(this.servoAngle);

    let msg =
      "" +
      leftMotorFloored +
      "," +
      rightMotorFloored +
      "," +
      servoFloored +
      "\n";
    console.log("sending robot data to socket: " + msg);
    this.socketIOService.socket.emit("robotControl", msg);
  }

  getOutboundStream() {
    if (this.peer.streams[0]) {
      return this.peer.streams[0];
    }
    throw "No outgoing streams in peer object";
  }

  checkConnectionType() {
    var findSelected = stats => {
      console.log(stats);
      let selectedPair;
      stats.forEach(s => {
        if (s.type == "transport") {
          selectedPair = stats.get(s.selectedCandidatePairId);
          // console.log(selectedPair);
        }
      });
      if (selectedPair) {
        return selectedPair;
      }
      throw "didn't find a selected candidate pair";
      // stats.values().find(s => s.type == "candidate-pair" && s.selected);
    };

    this.peer._pc
      .getStats()
      .then(stats => {
        let selectedPair = findSelected(stats);
        console.log(selectedPair);
        var candidate = stats.get(selectedPair.localCandidateId);
        console.log(candidate);
        this.connectionType = candidate.candidateType;
        // if (candidate.candidateType == "relayed") {
        //   console.log("Uses TURN server: " + candidate.ipAddress);
        // } else {
        //   console.log(
        //     "Does not use TURN (uses " + candidate.candidateType + ")."
        //   );
        // }
      })
      .catch(e => console.error(e));
  }
}
