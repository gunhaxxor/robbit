import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams, Platform } from "ionic-angular";
import { BleService } from "../../providers/bleservice/bleService";
import { Socket } from "ng-socket-io";
import * as Peer from "simple-peer";

// declare var cordova: any;

@IonicPage()
@Component({
  selector: "page-videolink",
  templateUrl: "videolink.html"
})
export class VideolinkPage {
  peer: any;
  localStream: MediaStream;
  remoteStream: MediaStream;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public platform: Platform,
    public bleService: BleService,
    private socket: Socket
  ) {}

  initiateListen() {
    this.peer = new Peer();

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
  }

  ionViewDidLoad() {
    // get video/voice stream
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false }) //permission saknas??
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

// c1efa933 => Samuels
// 09882a9b028aa8e8 => Nexus 5gunnar är bäst
// 09862476028bc6af => Mhp02
