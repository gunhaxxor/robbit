import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams, Platform } from "ionic-angular";
import { LoadingController } from "ionic-angular";
import { BleService } from "../../providers/bleservice/BleService";
import { Socket } from "ng-socket-io";
import * as Peer from "simple-peer";
// import encoding from 'text-encoding';

@IonicPage()
@Component({
  selector: "page-robotControl",
  templateUrl: "robotControl.html"
})
export class RobotControlPage {
  peer: any;
  localStream: MediaStream;
  remoteStream: MediaStream;

  //Robot controll variablar

  setStatus: any;
  peripheral: any;
  connecteddd: boolean = false;
  uartService: any;
  uartRXCharacteristic: any;
  robotControlIntervalId: any;
  arrowLeftActive: boolean;
  arrowForwardActive: boolean;
  arrowRightActive: boolean;
  arrowBackwardActive: boolean;
  servoUpActive: boolean;
  servoDownActive: boolean;

  constructor(
    public platform: Platform,
    public navCtrl: NavController,
    public loading: LoadingController,
    public navParams: NavParams,
    public bleService: BleService,
    private socket: Socket
  ) {
    socket.on("robotControl", msg => {
      console.log("received socket msg: " + JSON.stringify(msg));
      this.bleService.send(msg);
    });
  }

  //user is leaving the selected page.
  ionViewWillLeave() {
    clearInterval(this.robotControlIntervalId);
  }
  ionViewDidEnter() {
    if (this.bleService.sharedState.isConnectedToDevice) {
      console.log(
        "skipping socket emit interval loop because we are connected to BLE"
      );
      return;
    }
    let servo = 165;
    console.log("ionViewWillEnter triggered");
    this.robotControlIntervalId = setInterval(() => {
      if (!this.bleService.sharedState.isConnectedToDevice) {
        let forwardAmt = 0;
        let turnAmt = 0;
        ///Let's check here if we are available to send drive instructions to selected robot.
        if (this.arrowLeftActive) {
          turnAmt -= 1023;
        }
        if (this.arrowForwardActive) {
          forwardAmt += 1023;
        }
        if (this.arrowRightActive) {
          turnAmt += 1023;
        }
        if (this.arrowBackwardActive) {
          forwardAmt -= 1023;
        }

        if (this.servoUpActive) {
          servo += 15;
        }
        if (this.servoDownActive) {
          servo -= 15;
        }

        servo = Math.max(85, Math.min(165, servo));

        let motorValue1 = forwardAmt / 2 + turnAmt / 2;
        let motorValue2 = forwardAmt / 2 - turnAmt / 2;
        motorValue1 = Math.floor(motorValue1);
        motorValue2 = Math.floor(motorValue2);
        let msg = "" + motorValue1 + ";" + motorValue2 + ";" + servo + "\n";

        console.log("sending robot data to socket");
        this.socket.emit("robotControl", msg);
      }
    }, 200);
  }

  //videolink / test

  initiateListen() {
    this.peer = new Peer({
      initiator: false,
      stream: this.localStream, 
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          {
            urls: 'turn:54.197.33.120:3478',
            username: 'greger',
            credential: 'bajsmannen'
          }
        ]
      } 
    });

    this.peer.on("signal", data => {
      console.log("got signal data locally. Passing it on to signaling server");
      this.socket.emit("signal", data);
    });

    this.peer.on("stream", stream => {
      console.log("received stream from remote peer");
      // got remote video stream, now let's show it in a video tag
      var video = document.querySelector("video");
      video.srcObject = stream;
      video.play();
    });
  }

  initiateCall() {
    console.log("starting call as initiator");
    this.peer = new Peer({ initiator: true, stream: this.localStream });
    this.peer.on("signal", data => {
      console.log("got signal data locally. Passing it on to signaling server");
      this.socket.emit("signal", data);
    });

    this.peer.on("stream", stream => {
      console.log("received stream from remote peer");
      // got remote video stream, now let's show it in a video tag
      var video = document.querySelector("video");
      video.srcObject = stream;
      video.play();
    });
  }

  ionViewDidLoad() {
    // get video/voice stream
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: true }) //permission saknas??
      .then(stream => {
        console.log("got local media as a stream");
        this.localStream = stream;
      })
      .catch(err => console.log("error: " + err));

    this.socket.on("signal", data => {
      console.log("received signal message from socket");
      console.log(data);

      this.peer.signal(data);
    });
  }
}
