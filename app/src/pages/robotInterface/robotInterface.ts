import { Component, NgZone } from "@angular/core";
import { NavController, NavParams, Platform } from "ionic-angular";
import { LoadingController } from "ionic-angular";
import { BleService } from "../../providers/bleservice/bleService";
// import { Socket } from "ng-socket-io";
import { SocketIOService, } from '../../providers/socketioservice/socketioService';
import * as Peer from "simple-peer";
// import { Camera } from "@ionic-native/camera";
import { Diagnostic } from "@ionic-native/diagnostic";
import { NativeAudio } from "@ionic-native/native-audio";
import { ScreenOrientation } from "@ionic-native/screen-orientation";
import { StatusBar } from "@ionic-native/status-bar";
// import encoding from 'text-encoding';

@Component({
  selector: "page-robotInterface",
  templateUrl: "robotInterface.html"
})
export class RobotInterfacePage {
  peer: any;
  localStream: MediaStream;
  localVideoTrack: MediaStreamTrack;
  remoteStream: MediaStream;
  cameraFacingMode: string = "user";
  keepPeerActive: boolean = true;
  peerLinkActive: boolean = false;
  videoVerticalFlipped: boolean = false;
  showDriver: boolean = false;
  connected: boolean = false;
  isParked: boolean = false;
  isWaving: boolean = false;
  chat: any = { text: "" };
  robotName: string;
  defaultMessageTimeout: any = 60;
  // connectionInterval: any;

  constructor(
    public platform: Platform,
    public navCtrl: NavController,
    public loading: LoadingController,
    public navParams: NavParams,
    public bleService: BleService,
    // public socket: Socket,
    private socketIOService: SocketIOService,
    public diagnostic: Diagnostic,
    private nativeAudio: NativeAudio,
    private zone: NgZone,
    private screenOrientation: ScreenOrientation,
    private statusBar: StatusBar,
  ) { }

  // startWebRTC() {
  //   // console.log("Listening on calls!");
  //   this.initiateListen();
  // }

  //user is leaving the selected page.
  ionViewWillLeave() {
    console.log("will leave robot interface page. Cleaning up som shit");
    this.bleService.stop();
    this.socketIOService.socket.emit("leave", this.robotName);
    this.socketIOService.socket.off("robotControl");
    this.socketIOService.socket.off("signal");
    this.socketIOService.socket.off("room");

    this.keepPeerActive = false; //avoid retrying peer on close event
    this.tearDownPeer();
    // console.log("this.peer is:");
    // console.log(this.peer);
    this.peerLinkActive = false;
    // clearInterval(this.connectionInterval);
  }

  ionViewWillEnter() {
    console.log('Hiding the status bar');
    this.statusBar.hide();
    this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.LANDSCAPE);
  }

  ionViewDidEnter() {
    this.bleService.start();
    this.robotName = this.navParams.get("robotName");

    // this.socketIOService.socket.emit('join', this.robotName);
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
        if (msg.room == this.robotName && msg.joined) {
          console.log("attaching socket events");
          this.socketIOService.socket.on("robotControl", msg => {
            //console.log("received socket msg: " + JSON.stringify(msg));
            this.bleService.send(msg);
          });

          this.socketIOService.socket.on("signal", data => {
            console.log("Robot received signal message from socket");
            console.log(data);

            if (this.peer) {
              this.peer.signal(data);
            } else {
              console.error("no peer object to pass the signal on to!!!");
            }
          });
        }

        resolve();
      });
    });

    console.log("Trying to fetch camera");
    let cameraRetrieved = this.checkNeededPermissions()
      .then(() => {
        return this.retrieveCamera();
        // .then(() => {
        //   return navigator.mediaDevices
        //     .enumerateDevices()
        //     .then(function(devices) {
        //       devices.forEach(function(device) {
        //         console.log(
        //           device.kind + ": " + device.label + " id: " + device.deviceId
        //         );
        //       });
        //     });
        // });
      })
      .catch(err => console.log("failed to get permissions: " + err));

    //Wait for init to finish. Then initiate listen
    Promise.all([roomJoined, cameraRetrieved]).then(() => {
      console.log("init promises finished. Let's initiate listen");
      this.keepPeerActive = true; //retry in close event if peer closes.
      this.initiateListen();
    });

    this.nativeAudio
      .preloadComplex(
        "attention_sound",
        "assets/sound/kickhat-open-button-2.mp3",
        1,
        1,
        0
      )
      .then(
        () => {
          console.log("Wave audio loaded.");
        },
        err => {
          console.log("Failed to load wave audio!");
          console.log(err);
        }
      );
    this.nativeAudio
      .preloadComplex(
        "chat_sound",
        "assets/sound/Explosion2.mp3",
        1,
        1,
        0
      )
      .then(
        () => {
          console.log("Chat audio loaded.");
        },
        err => {
          console.log("Failed to load chat audio!");
          console.log(err);
        }
      );

    console.log("ionViewDidEnter finished");
  }

  initiateListen() {
    console.log("initiating listen");
    // let peerConfig = JSON.parse(process.env.PEER_CONFIG);
    let peerConfig = {
      "iceServers": [
        { "urls": `stun:${process.env.BACKEND_SERVER}:${process.env.TURN_UDP_PORT}` },
        { "urls": `turn:${process.env.BACKEND_SERVER}:${process.env.TURN_UDP_PORT}`, "username": process.env.TURN_USER, "credential": process.env.TURN_PASSWORD }]
    }
    console.log(
      "nr of videotracks in localstream when creating peer object: ",
      this.localStream.getVideoTracks().length,
      this.localStream
    );

    ////////////////////////////////////TEMP FOT REMOVING AUDIO
    // this.localStream.getAudioTracks()[0].enabled = false;

    this.peer = new Peer({
      initiator: false,
      stream: this.localStream,
      config: peerConfig
    });
    console.log("peer object is:");
    console.log(this.peer);
    this.peer.on("signal", data => {
      console.log(
        "Robot got signal data locally. Passing it on to signaling server"
      );
      this.socketIOService.socket.emit("signal", data);
    });
    this.peer.on("stream", stream => {
      console.log(
        "I am Robot and I am listener. Received stream from initiating peer"
      );
      // got remote video stream, now let's show it in a video tag
      let video: HTMLVideoElement = document.querySelector(
        "#robot-remote-video"
      );
      video.srcObject = stream;
      // video.play();
    });
    this.peer.on("connect", () => {
      console.log("connection event!!!");
      this.peerLinkActive = true;
    });
    this.peer.on("close", () => {
      console.log("peer connection closed");
      console.log("this.peer: ");
      console.log(this.peer);
      if (this.keepPeerActive) {
        console.log(
          "trying to reinitiate listen. Wonder if peer object will be invalid/leaked when we just create a new one to replace the previous??"
        );
        this.tearDownPeer();
        this.initiateListen();
      }
      this.peerLinkActive = false;
    });
    this.peer.on("error", err => {
      console.error("!! error " + err);
    });
    this.peer.on("track", (track, stream) => {
      console.log("remote track added: ", track);
      console.log("stream is: ", stream);
      console.log(
        "reattaching the stream to the videotag. Might help weird glitch bug?"
      );

      let video: HTMLVideoElement = document.querySelector(
        "#robot-remote-video"
      );
      video.srcObject = stream;
    });

    this.peer.on("data", msg => {
      console.log("received callInfo  msg: " + msg);
      let msgObj = JSON.parse(String(msg));

      if (msgObj.hasOwnProperty("endcall") && msgObj.endcall) {
        console.log("Received endcall.");
        this.zone.run(() => {
          // because we are in a callback this would have happened outside angulars zone
          // which wouldn't update the template
          // that's why we force it to run inside the zone
          // and update the interface instantly
          this.peerLinkActive = false;
          this.tearDownPeer();
          this.initiateListen();
        });
      }
      if (msgObj.hasOwnProperty("showDriverCamera")) {
        this.showDriver = msgObj.showDriverCamera;
        // console.log(this.showDriver);
      }
      if (msgObj.hasOwnProperty("muteDriver")) {
        // TODO: Not implemented yet.
        // Probably want to show this in the interface somehow
        //this.muteDriver = msgObj.muteDriver;
        //console.log(this.muteDriver);
      }
      if (msgObj.hasOwnProperty("emoji")) {
        let emojiDiv: HTMLElement = document.getElementById("emoji");
        emojiDiv.innerHTML = msgObj.emoji;
        console.log("found emoji:" + msgObj.emoji);
      }
      if (msgObj.hasOwnProperty("chat")) {
        const incomingChat = msgObj.chat;

        //handle clear request
        if (incomingChat['clear']) {
          this.chat.isShown = false;
          return;
        }

        console.log("found chat:" + incomingChat.text);

        this.nativeAudio.play("chat_sound");

        incomingChat['chatTimeout'] = setTimeout(() => {
          incomingChat.isShown = false;
        }, incomingChat.timeoutSeconds ? incomingChat.timeoutSeconds * 1000 : this.defaultMessageTimeout * 1000);

        this.chat = incomingChat;

      }
      if (msgObj.hasOwnProperty("isParked")) {
        this.isParked = msgObj.isParked;
        console.log(this.isParked);
      }
      if (msgObj.hasOwnProperty("isWaving")) {
        this.isWaving = msgObj.isWaving;
        console.log(this.isWaving);
        if (this.isWaving) {
          this.nativeAudio.play("attention_sound");
        }
      }
    });
  }

  changeCamera() {
    // this.peer.removeStream(this.localStream);
    this.localStream.getTracks().forEach(trk => trk.stop());
    if (this.cameraFacingMode == "environment") {
      this.cameraFacingMode = "user";
    } else {
      this.cameraFacingMode = "environment";
    }
    let video: HTMLVideoElement = document.querySelector("#robot-local-video");
    video.pause();
    this.retrieveCamera().then(() => {
      // this.peer.addStream(this.localStream);
    });
  }

  retrieveCamera() {
    // get video/voice stream
    console.log("retrieving camera!");
    let promise = navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: this.cameraFacingMode },
        audio: true
      })
      .then(stream => {
        console.log("Robot got local media as a stream");
        this.localStream = stream;
        this.localVideoTrack = stream.getVideoTracks()[0];
        console.log(this.localStream);
        let video: HTMLVideoElement = document.querySelector(
          "#robot-local-video"
        );
        video.srcObject = stream;
        video.volume = 0;
        // video.play();
        return Promise.resolve();
      })
      .catch(err => {
        console.log("error: " + err);
        return Promise.reject(err);
      });
    return promise;
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

  sendData(sendObj: object) {
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

  hangUp() {
    this.sendData({ endcall: true });
    this.tearDownPeer();
    this.navCtrl.pop();
  }

  tearDownPeer() {
    if (this.peer) {
      this.peer.destroy();
    }
    // delete this.peer;
    this.peer = null;
  }
}
