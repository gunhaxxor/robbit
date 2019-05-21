import { Component, ElementRef, HostListener, ViewChild } from "@angular/core";
import { NavController, AlertController, NavParams, Platform, PopoverController, LoadingController } from "ionic-angular";
import { EmojiPage } from '../emoji-page/emoji-page';
import { SettingsPage } from '../settings-page/settings-page';
// import { BleService } from "../../providers/bleservice/bleService";
import { Socket } from "ng-socket-io";
import * as Peer from "simple-peer";
import nipplejs from "nipplejs";
// import { Camera } from "@ionic-native/camera";
import { Diagnostic } from "@ionic-native/diagnostic";
// import "webrtc-adapter";
import 'zone.js/dist/webapis-rtc-peer-connection';
import 'zone.js/dist/zone-patch-user-media';
// import encoding from 'text-encoding';

declare var CommandBot: any;

@Component({
  selector: "page-driverInterface",
  templateUrl: "driverInterface.html"
})
export class DriverInterfacePage {
  peer: any;
  peerLinkActive: boolean = false;
  videoLinkWaitingForAnswer = false;
  initiateCallTimeout: any;
  localStream: MediaStream;
  localVideoTag: HTMLVideoElement;
  localVideoTrack: any;
  localAudioTrack: any;
  remoteStream: MediaStream;
  remoteVideoTag: HTMLVideoElement
  showCamera: boolean;
  muteAudio: boolean;
  currentEmoji: string = "🙂";
  robotControlIntervalId: any;
  // arrowLeftActive: boolean;
  // arrowForwardActive: boolean;
  // arrowRightActive: boolean;
  // arrowBackwardActive: boolean;
  forwardActive: boolean;
  reverseActive: boolean;
  robotThrottle: number = 0;
  robotRotation: number = 0;
  servoAngleChange: number = 0;
  isParked: boolean = false;
  isWaving: boolean = false;
  cameraOption: string = "user";
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
  chat: any = { text: "", sendText: "", isShown: false, timeoutSeconds: 60 };
  chatTimeout: any;
  bot: any;
  voiceControlEnabled: boolean = false;
  voiceDriveTimeout: any;
  voiceDriveIntervalMillis: number = 200;
  voiceDriveTimeoutMillis: number = 2000;
  voiceRotateTimeoutMillis: number = 1000;
  voiceRecognitionState: number = -1;
  @ViewChild('chatInput') chatInput: ElementRef;

  constructor(
    public platform: Platform,
    public navCtrl: NavController,
    private alertCtrl: AlertController,
    public loading: LoadingController,
    public navParams: NavParams,
    // public bleService: BleService,
    private socket: Socket,
    // private camera: Camera,
    private diagnostic: Diagnostic,
    public popoverEmojiCtrl: PopoverController,
    public popoverSettingsCtrl: PopoverController
  ) {

  }

  @HostListener('window:beforeunload', ['$event'])
  handler(event: Event) {
    console.log('beforeunload-event triggered');
    event.returnValue = false;
  }

  // ionViewCanLeave(): boolean {
  //   return window.confirm("Vill du verkligen lämna?")
  // }

  //user is leaving the selected page.
  ionViewDidLeave() {
    this.peerLinkActive = false;
  }

  ionViewWillLeave() {
    console.log("will leave driver interface page. Cleaning up som shit");
    this.socket.emit("leave", this.robotName);
    console.log(this.socket.ioSocket.listeners("robotControl"));
    console.log(this.socket.ioSocket.listeners("signal"));
    console.log(this.socket.ioSocket.listeners("room"));

    this.socket.removeAllListeners("robotControl");
    this.socket.removeAllListeners("signal");
    this.socket.removeAllListeners("room");

    console.log(this.socket.ioSocket.listeners("robotControl"));
    console.log(this.socket.ioSocket.listeners("signal"));
    console.log(this.socket.ioSocket.listeners("room"));
    clearInterval(this.robotControlIntervalId);
    if (this.peer) {
      this.peer.destroy();
    }
    delete this.peer;
  }

  ionViewDidEnter() {

    this.robotName = this.navParams.get('robotName');
    this.localVideoTag = document.querySelector("#driver-local-video");
    this.remoteVideoTag = document.querySelector("#driver-remote-video");

    if (this.socket.ioSocket.connected) {
      console.log('socket was already connected. Trying to join room');
      this.socket.emit('join', this.robotName);
    } else {
      this.socket.on('connect', () => {
        console.log('socket connected event. Trying to join room');
        this.socket.emit('join', this.robotName);
      });
    }

    let roomJoined: Promise<{}> = new Promise((resolve, reject) => {
      this.socket.on("room", msg => {
        console.log('room message:' + JSON.stringify(msg));
        if (msg.room == this.robotName && msg.joined) {
          console.log("attaching socket events");
          this.socket.on("robotControl", msg => {
            console.log("received socket msg: " + JSON.stringify(msg));
            // this.bleService.send(msg);
          });

          this.socket.on("signal", data => {
            console.log("Driver received signal message from socket");
            console.log(data);

            if (this.peer) {
              this.peer.signal(data);
            }
          });
        }
        resolve();
      })
    });

    this.socket.on("message", msg => {
      console.log("message from socket server: " + msg);
    });

    let cameraRetrieved = this.retrieveCamera();
    // let cameraRetrieved = this.checkNeededPermissions().then(() => {
    //   return this.retrieveCamera();
    // }).catch((err) => console.log("failed to get permissions: " + err));
    // console.log(cameraRetrieved);

    Promise.all([roomJoined, cameraRetrieved]).then(() => {
      console.log("setup promises resolved. Inititating call!");
      // console.log(roomJoined);
      // console.log(cameraRetrieved);
      this.initiateCall();
    }).catch(err => {
      console.error("FAILED TO SETUP ALL THE STUFFZ! NOW CRY!!!");
      console.error(err);
    })


    // Let's divide the motorvariables into drive and look components.
    this.robotThrottle = 0;
    this.robotRotation = 0;
    this.servoAngleChange = 0;
    let options = {
      zone: document.getElementById("zone-joystick"),
      mode: 'static',
      position: { right: '70%', top: '50%' },
      color: 'white',
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
        this.robotThrottle = this.ROBOT_MOTOR_MAX_THROTTLE * this.DRIVE_MOTOR_SCALE;
      }
      else if (this.reverseActive) {
        this.robotThrottle = -this.ROBOT_MOTOR_MAX_THROTTLE * this.DRIVE_MOTOR_SCALE;
      } else {
        this.robotThrottle = 0;
      }

      let rotationMotorAdjustment = this.robotRotation * this.ROBOT_MOTOR_MAX_THROTTLE * this.TURN_MOTOR_SCALE; // -20 to +20

      let leftMotor = this.robotThrottle + rotationMotorAdjustment;
      let rightMotor = this.robotThrottle - rotationMotorAdjustment;

      //Section for constraining motor values within max allowed throttle
      let ratio = 1;
      if (Math.abs(leftMotor) > this.ROBOT_MOTOR_MAX_THROTTLE || Math.abs(rightMotor) > this.ROBOT_MOTOR_MAX_THROTTLE) {
        ratio = this.ROBOT_MOTOR_MAX_THROTTLE / Math.max(Math.abs(leftMotor), Math.abs(rightMotor));
      }
      leftMotor *= ratio;
      rightMotor *= ratio;

      let leftMotorFloored = Math.floor(leftMotor);
      let rightMotorFloored = Math.floor(rightMotor);

      this.servoAngle -= this.servoAngleChange * this.SERVO_SCALE;
      this.servoAngle = Math.max(this.SERVO_MIN_VALUE, Math.min(this.SERVO_MAX_VALUE, this.servoAngle));
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
      this.socket.emit("robotControl", msg);
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

    // ugly hack for now, to make it call the robot after a short delay
    // hoping that all webrtc setup is done by then.
    // Maybe we can do this with a promise instead?
    // setTimeout(() => {
    //   this.initiateCall();
    // }, 2000);
  }

  @HostListener('document:keydown', ['$event'])
  @HostListener('document:keyup', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // console.log("key down:"+event.key);

    if (document.activeElement.className.includes("text-input")) {
      return;
    }

    if (event.type == "keydown") {
      switch (event.key) {
        case 'ArrowUp':
          if (this.peerLinkActive) {
            this.servoAngleChange = 1;
          }
          break;
        case 'ArrowDown':
          if (this.peerLinkActive) {
            this.servoAngleChange = -1;
          }
          break;
        case 'ArrowLeft':
          if (this.peerLinkActive) {
            this.robotRotation = -1;
          }
          break;
        case 'ArrowRight':
          if (this.peerLinkActive) {
            this.robotRotation = 1;
          }
          break;
        case 'a':
          if (!this.isParked) {
            this.forwardActive = true;
          }
          break;
        case 'z':
          if (!this.isParked) {
            this.reverseActive = true;
          }
          break;
        case 'i':
          this.presentSettingsPopover(undefined);
          break;
        case 'e':
          if (!this.showCamera) {
            this.presentEmojiPopover(undefined);
          }
          break;
        case 'k':
          this.toggleVideoTrack();
          break;
        case 'm':
          this.toggleAudioTrack();
          break;
        case 'w':
          if (this.peerLinkActive) {
            this.toggleWaving();
          }
          break;
      }
    }
    else if (event.type == "keyup") {
      switch (event.key) {
        case "a":
          this.forwardActive = false;
          break;
        case "z":
          this.reverseActive = false;
          break;
        case 'ArrowLeft':
          this.robotRotation = 0;
          break;
        case 'ArrowRight':
          this.robotRotation = 0;
          break;
        case 'ArrowUp':
          this.servoAngleChange = 0;
          break;
        case 'ArrowDown':
          this.servoAngleChange = 0;
          break;
      }
    }
  }

  // Make sure this won't get called before we have retrieved local media and joined the correct socket room!
  initiateCall() {
    console.log("starting call as initiator");
    // make sure we won't let a set timer roam free before we create a new one.
    // makes no sense when I think about it...
    // if (this.initiateCallTimeout != undefined) {
    //   console.log("There was already a timeout set. Clearing it.");
    //   clearInterval(this.initiateCallTimeout);
    // }
    this.initiateCallTimeout = setTimeout(() => {
      this.tearDownPeer();
      this.initiateCall();
    }, 10000);
    this.videoLinkWaitingForAnswer = true;
    let peerConfig = JSON.parse(process.env.PEER_CONFIG);
    this.peer = new Peer({ initiator: true, stream: this.localStream, config: peerConfig });
    console.log("peer object is:");
    console.log(this.peer);
    this.peer.on("signal", data => {
      console.log("Driver got signal data locally. Passing it on to signaling server");
      this.socket.emit("signal", data);
    });
    this.peer.on("stream", stream => {
      console.log("I am Driver and I am initiator. Received stream from listening peer");
      // got remote video stream, now let's show it in a video tag
      // var video: any = document.querySelector("#driver-remote-video");
      this.remoteVideoTag.srcObject = stream;
      // video.play();
    });
    this.peer.on('connect', () => {
      clearTimeout(this.initiateCallTimeout);
      console.log('peer connected event');
      console.log("peer object is:");
      console.log(this.peer);
      this.peerLinkActive = true;
      this.videoLinkWaitingForAnswer = false;


      this.removeVideoTrack(); // disable video as default
      this.sendEmoji(this.currentEmoji);
      this.clearChat();
    });

    // TODO: Proper shutdown of connection. Including sockets and all of that...
    this.peer.on('close', () => {
      console.log('peer connection closed');
      console.log('this.peer: ' + this.peer);
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
    this.peer.on('error', err => {
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
      title: 'Avsluta samtal',
      message: 'Vill du lägga på?',
      buttons: [
        {
          text: 'Stanna',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Avsluta',
          handler: () => {
            console.log('Exit confirmed');
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
      // This wa an effort to make the browser release the camera when returning to home screen. Doesn't seem to work though...
      if (this.localStream && this.localStream.getTracks) {
        console.log('stopping all mediatracks on localstream');
        this.localStream.getTracks().forEach(track => track.stop());
        // for (let track of tracks) {
        //   track.stop();
        // }
        this.localVideoTag.srcObject = null;

        this.localStream = null;
      }
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

  changeCamera() {
    if (this.cameraOption == "environment") {
      this.cameraOption = "user";
    } else {
      this.cameraOption = "environment";
    }
    // let video: HTMLVideoElement = document.querySelector("#driver-local-video");
    this.localVideoTag.pause();
    this.retrieveCamera();
  }

  toggleVideoTrack() {
    this.showCamera = !this.showCamera;
    if (this.showCamera) {
      this.addVideoTrack();
    }
    else {
      this.removeVideoTrack();
    }
  }

  removeVideoTrack() {
    console.log("removing camera stream");
    if (!this.localStream) {
      console.log("this.localStream is undefined. Can't remove (video)track from it");
      return;
    }
    let videoTracks = this.localStream.getVideoTracks();
    if (videoTracks.length == 0) {
      console.log("No video tracks found on local stream");
      return;
    }
    // if (this.peer != null) {
    this.peer.removeTrack(videoTracks[0], this.localStream);
    // }
    this.showCamera = false;
    this.sendData({ showDriverCamera: this.showCamera });
    console.log("Video track removed from stream.");
  }

  addVideoTrack() {
    if (!this.peer) {
      return;
    }
    if (!this.localStream) {
      console.error("this.localStream is undefined. Can't add (video)track to it");
      return;
    }
    if (!this.localVideoTrack) {
      console.error("no local video track defined. Can't add it to the stream");
      return;
    }
    // if (this.peer != null) {
    this.peer.addTrack(this.localVideoTrack, this.localStream);
    // }
    this.showCamera = true;
    this.sendData({ showDriverCamera: this.showCamera });

    console.log("video track added to stream.");
  }

  toggleAudioTrack() {
    this.muteAudio = !this.muteAudio;
    if (this.muteAudio) {
      this.removeAudioTrack();
    }
    else {
      this.addAudioTrack();
    }
  }

  removeAudioTrack() {
    if (!this.peer) {
      return;
    }
    if (!this.localStream) {
      console.error("this.localStream is undefined. Can't remove track from it");
      return;
    }
    let audioTracks = this.localStream.getAudioTracks();
    if (audioTracks.length == 0) {
      console.log("No audio tracks found on local stream");
      return;
    }

    // if (this.peer != null) {
    this.peer.removeTrack(audioTracks[0], this.localStream);
    // }
    this.muteAudio = true;
    this.sendData({ muteDriver: this.muteAudio });
    console.log("audio track removed from stream.");
  }

  addAudioTrack() {
    if (!this.peer) {
      return;
    }
    if (!this.localStream) {
      console.error("this.localStream is undefined. Can't add track to it");
      return;
    }
    if (!this.localAudioTrack) {
      console.error("no local audio track defined. Can't add it to the stream");
      return;
    }

    // if (this.peer != null) {
    this.peer.addTrack(this.localAudioTrack, this.localStream);
    // }
    this.muteAudio = false;
    this.sendData({ muteDriver: this.muteAudio });
    console.log("audio track added to stream.");
  }

  retrieveCamera() {
    // get video/voice stream
    console.log("retrieving camera!");
    return navigator.mediaDevices.getUserMedia({ video: true /*{ facingMode: this.cameraOption }*/, audio: true })
      .then((stream) => {
        console.log("Driver got local media as a stream");
        this.localStream = stream;
        // let video: HTMLVideoElement = document.querySelector("#driver-local-video");
        this.localVideoTrack = stream.getVideoTracks()[0];
        this.localAudioTrack = stream.getAudioTracks()[0];
        this.localVideoTag.srcObject = stream;
        this.localVideoTag.volume = 0;
        // video.play();
        this.showCamera = true;
        this.muteAudio = false;
      }).catch(err => {
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
      driverPage: () => { return this; }
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

  clearChat() {
    this.chat.isShown = false;
    this.sendData({ chat: { text: this.chat.sendText, isShown: this.chat.isShown } });
  }

  sendChat() {
    console.log("sending chat");
    console.log(this.chat.text);
    if (this.chatSoundEnabled) {
      this.chatSound.play();
    }
    this.chat.isShown = true;
    this.sendData({ chat: { text: this.chat.text, isShown: this.chat.isShown } });
    this.chat.sendText = this.chat.text;
    this.chat.text = "";
    // this is a rather ugly way of calling blur(onfocus) on the textfield
    // but we want to close the smartphone keyboard
    // See https://github.com/ionic-team/ionic/issues/14130
    this.chatInput['_native'].nativeElement.blur();
    if (this.chat.sendText != "") {
      if (this.chatTimeout) {
        clearTimeout(this.chatTimeout);
      }
      this.chatTimeout = setTimeout(() => {
        this.clearChat();
      }, this.chat.timeoutSeconds * 1000);
    }
    else {
      this.clearChat();
    }
  }

  sendData(sendObj: object) {
    if (this.peer != null && this.peerLinkActive) {
      try {
        this.peer.send(JSON.stringify(sendObj));
      }
      catch (err) {
        console.log("Error while trying to send data:");
        console.log(err);
      }
    } else {
      console.log("no peer or peerLinkActive. Won't send any RTC-datachannel stuff");
    }
  }

  checkNeededPermissions() {
    // let returnPromise = new Promise();
    if (this.diagnostic.isCameraAuthorized(false) && this.diagnostic.isMicrophoneAuthorized()) {
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
      this.bot = new CommandBot;
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
      this.bot.addCommand("ring upp", () => {
        this.initiateCall();
      });
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
    }
    else {
      console.log("stopping voice control");
      this.bot.stop();

    }
  }

  drive(leftMotor: number, rightMotor: number, isRotation: boolean) {
    let leftMotorFloored = 0;
    let rightMotorFloored = 0;

    if (isRotation) {
      let robotRotation = 1.0;
      let rotationMotorAdjustment = robotRotation * this.ROBOT_MOTOR_MAX_THROTTLE * this.TURN_MOTOR_SCALE; // -20 to +20

      leftMotorFloored = Math.floor(leftMotor * rotationMotorAdjustment);
      rightMotorFloored = Math.floor(rightMotor * rotationMotorAdjustment);
    }
    else {
      leftMotorFloored = Math.floor(leftMotor * this.ROBOT_MOTOR_MAX_THROTTLE * this.DRIVE_MOTOR_SCALE);
      rightMotorFloored = Math.floor(rightMotor * this.ROBOT_MOTOR_MAX_THROTTLE * this.DRIVE_MOTOR_SCALE);
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
    this.socket.emit("robotControl", msg);
  }


  angleChange(servoAngleChange) {
    let leftMotorFloored = 0;
    let rightMotorFloored = 0;
    this.servoAngle += servoAngleChange * this.SERVO_SCALE;
    this.servoAngle = Math.max(this.SERVO_MIN_VALUE, Math.min(this.SERVO_MAX_VALUE, this.servoAngle));
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
    this.socket.emit("robotControl", msg);
  }


}
