import { Component, NgZone } from "@angular/core";
import { NavController, NavParams, Platform } from "ionic-angular";
import { LoadingController } from "ionic-angular";
import { BleService } from "../../providers/bleservice/bleService";
import { Socket } from "ng-socket-io";
import * as Peer from "simple-peer";
// import { Camera } from "@ionic-native/camera";
import { Diagnostic } from "@ionic-native/diagnostic";
import { NativeAudio } from '@ionic-native/native-audio';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import "webrtc-adapter";
// import encoding from 'text-encoding';

@Component({
  selector: "page-robotInterface",
  templateUrl: "robotInterface.html"
})
export class RobotInterfacePage {
  peer: any;
  localStream: MediaStream;
  remoteStream: MediaStream;
  cameraOption: string = "constraint";
  keepPeerActive: boolean = true;
  peerLinkActive: boolean = false;
  videoVerticalFlipped: boolean = false;
  showDriver: boolean = true;
  connected: boolean = false;
  isParked: boolean = false;
  isWaving: boolean = false;
  chat: any = { text: "" };
  robotName: string;
  networkConnected: boolean;
  locationEnabled: boolean;
  connectionInterval: any;

  constructor(
    public platform: Platform,
    public navCtrl: NavController,
    public loading: LoadingController,
    public navParams: NavParams,
    public bleService: BleService,
    public socket: Socket,
    // private camera: Camera,
    public diagnostic: Diagnostic,
    private nativeAudio: NativeAudio,
    private zone: NgZone,
    private screenOrientation: ScreenOrientation
  ) {
  }

  // startWebRTC() {
  //   // console.log("Listening on calls!");
  //   this.initiateListen();
  // }

  //user is leaving the selected page.
  ionViewWillLeave() {
    console.log("will leave robot interface page. Cleaning up som shit");
    this.bleService.stop();
    this.socket.emit("leave", this.robotName);
    this.socket.removeAllListeners("robotControl");
    this.socket.removeAllListeners("signal");
    this.socket.removeAllListeners("room");


    this.keepPeerActive = false; //avoid retrying peer on close event
    this.peer.destroy();
    delete this.peer;
    // console.log("this.peer is:");
    // console.log(this.peer);
    this.peerLinkActive = false;
    clearInterval(this.connectionInterval);
  }

  ionViewWillEnter() {
    this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.LANDSCAPE);
  }

  ionViewDidEnter() {
    this.bleService.start();

    // check instantly, then every 5 seconds.
    {
      this.checkWifiAvailable();
      this.checkLocationEnabled();
    }
    this.connectionInterval = setInterval(() => {
      this.checkWifiAvailable();
      this.checkLocationEnabled();
    }, 5000);

    this.robotName = this.navParams.get('robotName');

    // this.socket.emit('join', this.robotName);
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
        if (msg.room == this.robotName && msg.joined) {
          console.log("attaching socket events");
          this.socket.on("robotControl", msg => {
            //console.log("received socket msg: " + JSON.stringify(msg));
            this.bleService.send(msg);
          });

          this.socket.on("signal", data => {
            console.log("Robot received signal message from socket");
            console.log(data);

            if (this.peer) {
              this.peer.signal(data);
            }
          });
        }

        resolve();
      });
    });

    console.log("Trying to fetch camera");
    let cameraRetrieved = this.checkNeededPermissions().then(() => {
      return this.retrieveCamera().then(() => {
        return navigator.mediaDevices.enumerateDevices().then(function (devices) {
          devices.forEach(function (device) {
            console.log(device.kind + ": " + device.label + " id: " + device.deviceId);
          });
        });

      });
    }).catch((err) => console.log("failed to get permissions: " + err));

    //Wait for init to finish. Then initiate listen
    Promise.all([roomJoined, cameraRetrieved]).then(() => {
      console.log("init promises finished. Let's initiate listen");
      this.keepPeerActive = true; //retry in close event if peer closes.
      this.initiateListen();
    })

    this.nativeAudio.preloadComplex('attention_sound', 'assets/sound/kickhat-open-button-2.mp3', 1, 1, 0).then(() => {
      console.log("Wave audio loaded.");
    },
      (err) => {
        console.log("Failed to load wave audio!");
        console.log(err);
      });
    this.nativeAudio.preloadComplex('chat_sound', 'assets/sound/ertfelda-correct.mp3', 1, 1, 0).then(() => {
      console.log("Chat audio loaded.");
    },
      (err) => {
        console.log("Failed to load chat audio!");
        console.log(err);
      });

    console.log("ionViewDidEnter finished");
  }


  initiateListen() {
    console.log("initiating listen");
    let peerConfig = JSON.parse(process.env.PEER_CONFIG);
    this.peer = new Peer({
      initiator: false,
      stream: this.localStream,
      config: peerConfig
    });
    console.log("peer object is:");
    console.log(this.peer);
    this.peer.on('signal', data => {
      console.log("Robot got signal data locally. Passing it on to signaling server");
      this.socket.emit("signal", data);
    });
    this.peer.on('stream', stream => {
      console.log("I am Robot and I am listener. Received stream from initiating peer");
      // got remote video stream, now let's show it in a video tag
      let video: HTMLVideoElement = document.querySelector("#robot-remote-video");
      video.srcObject = stream;
      // video.play();
    });
    this.peer.on('connect', () => {
      console.log('connection event!!!');
      this.peerLinkActive = true;
    });
    this.peer.on('close', () => {
      console.log('peer connection closed');
      console.log('this.peer: ');
      console.log(this.peer);
      if (this.keepPeerActive) {
        console.log("trying to reinitiate listen. Wonder if peer object will be invalid/leaked when we just create a new one to replace the previous??");
        this.initiateListen();
      }
      this.peerLinkActive = false;
    });
    this.peer.on("data", msg => {
      //console.log("received callInfo  msg: " + JSON.stringify(msg));
      let msgObj = JSON.parse(String(msg));

      if (msgObj.hasOwnProperty("endcall") && msgObj.endcall) {
        console.log("Received endcall.");
        this.zone.run(() => {
          // because we are in a callback this would have happened outside angulars zone
          // which wouldn't update the template
          // that's why we force it to run inside the zone
          // and update the interface instantly
          this.peerLinkActive = false;
          this.initiateListen();
        });
      }
      if (msgObj.hasOwnProperty("showDriverCamera")) {
        this.showDriver = msgObj.showDriverCamera;
        console.log(this.showDriver);
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
        this.chat = msgObj.chat;
        if (this.chat != "" && this.chat.isShown) {
          this.nativeAudio.play('chat_sound');
        }
        console.log("found chat:" + this.chat.text);
      }
      if (msgObj.hasOwnProperty("isParked")) {
        this.isParked = msgObj.isParked;
        console.log(this.isParked);
      }
      if (msgObj.hasOwnProperty("isWaving")) {
        this.isWaving = msgObj.isWaving;
        console.log(this.isWaving);
        if (this.isWaving) {
          this.nativeAudio.play('attention_sound');
        }
      }
      // console.log("received data: " + msg);

      // if(msg.substring(0, 10) == "callInfo: ") {
      //   msg = msg.substring(10);
      //   switch(msg) {
      //     case "endcall":
      //       console.log("Received endcall.");
      //       this.zone.run(()=> {
      //         // because we are in a callback this would have happened outside angulars zone
      //         // which wouldn't update the template
      //         // that's why we force it to run inside the zone
      //         // and update the interface instantly
      //         this.videoLinkActive = false;
      //         this.initiateListen();
      //       });
      //       break;
      //     case "driver showCamera true":
      //       this.showDriver = true;
      //       break;
      //     case "driver showCamera false":
      //       this.showDriver = false;
      //       break;
      //     default:
      //       console.log("default switch");
      //       if(msg.substring(0,6) == "emoji "){
      //         msg = msg.substring(6);
      //         console.log("found emoji:"+msg);
      //         let emojiDiv: HTMLElement = document.getElementById("emoji");
      //         emojiDiv.innerHTML = msg;
      //       }

      //       break;
      //   }
      // }


    });
  }

  changeCamera() {
    if (this.cameraOption == "environment") {
      this.cameraOption = "constraint";
    } else {
      this.cameraOption = "environment";
    }
    let video: HTMLVideoElement = document.querySelector("#robot-local-video");
    video.pause();
    this.retrieveCamera();
  }

  retrieveCamera() {
    // get video/voice stream
    console.log("retrieving camera!");
    let promise = navigator.mediaDevices
      .getUserMedia({ video: { facingMode: this.cameraOption, frameRate: 15 }, audio: true })
      .then(stream => {
        console.log("Robot got local media as a stream");
        this.localStream = stream;
        let video: HTMLVideoElement = document.querySelector("#robot-local-video");
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
    if (this.diagnostic.isCameraAuthorized(false) && this.diagnostic.isMicrophoneAuthorized()) {
      return Promise.resolve();
    }
    return Promise.reject("Camera and mic authorization promise rejected!");
  }

  checkWifiAvailable() {
    this.diagnostic.isWifiAvailable().then((available: any) => {
      console.log("WiFi is " + (available ? "available" : "not available"));
      this.networkConnected = available;
    }).catch((error: any) => {
      console.error("Error while checking wifi: " + error);
    });
  }

  checkLocationEnabled() {
    this.diagnostic.isLocationEnabled().then((enabled: any) => {
      console.log("Location is " + (enabled ? "enabled" : "not enabled"));
      this.locationEnabled = enabled;
    }).catch((error: any) => {
      console.error("Error while checking location: " + error);
    });
  }


  toggleParking() {
    this.isParked = !this.isParked;
    this.sendData({ isParked: this.isParked });
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

  hangUp() {
    this.sendData({ endcall: true });
    this.tearDownPeer();
    this.navCtrl.pop();
  }

  tearDownPeer() {

    if (this.peer) {
      this.peer.destroy();
    }
  }
}
