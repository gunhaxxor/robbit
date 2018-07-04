import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams, Platform } from "ionic-angular";
import { BleService } from "../../providers/bleservice/BleService";
import { Socket } from "ng-socket-io";
declare var cordova: any;

@IonicPage()
@Component({
  selector: "page-videolink",
  templateUrl: "videolink.html"
})
export class VideolinkPage {
  session: any;
  callInProgress: boolean = false;
  callIgnored: boolean = false;
  callEnded: boolean = false;
  userId: number;
  peerId: number;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public platform: Platform,
    public bleService: BleService,
    private socket: Socket
  ) {
    this.userId = Math.floor(1000 * Math.random());

    // this.socket.on("messageReceived", this.onVideoMessageReceived);
    this.socket.on("onMessage", message => {
      this.session.receiveMessage(message);
    });
  }

  login() {
    this.socket.emit("login", { id: this.userId });
  }

  startCall() {
    this.isCalling = true;
    this.callIgnored = false;
    this.callEnded = false;

    SocketService.emit("sendMessage", {
      id: id,
      peer_id: this.peer_id, // peerId?
      type: "call"
    });
  }

  config: any;
  call(isInitiator, peerId) {
    this.config = {
      isInitiator: isInitiator, // True eller false på Isinitiator
      stun: {
        host: "stun:stun.l.google.com:19302"
      },
      streams: {
        audio: true,
        video: true
      }
    };

    this.session = new cordova.plugins.phonertc.Session(this.config);
    cordova.plugins.phonertc.setVideoView({
      container: document.getElementById("video-container"),
      local: {
        position: [0, 0],
        size: [100, 100]
      }
    });

    this.session.on("sendMessage", data => {
      this.socket.emit("sendMessage", {
        id: this.userId,
        peer_id: peerId,
        type: "phonertc_handshake",
        data: JSON.stringify(data)
      });
    });

    this.session.on("disconnect", () => {
      this.socket.emit("sendMessage", {
        id: this.userId,
        peer_id: peerId,
        type: "ignore"
      });
    });

    this.session.call();
  }

  // onVideoMessageReceived(message) {
  //   switch (message.type) {
  //     case "call":
  //       break;
  //     case "answer": // Lägga till så man kan svara!
  //       this.call(true, this.peerId);
  //       break;
  //     case "phonertc_handshake":
  //       // run this only once during the start of a call
  //       this.session.receiveMessage(JSON.parse(message.data));
  //       break;
  //   }
  // }

  ionViewDidLoad() {
    this.bleService.ConnectedIcon();
    console.log("ionViewDidLoad VideolinkPage");
    // console.log(JSON.stringify(cordova.plugins), null, 2);
    this.socket.on("message", msg => {
      console.log("Recieved message: " + msg);
    });
    this.socket.emit("message", "teeeestar");
  }

  // messagesender() {
  //   // console.log(JSON.stringify(cordova.plugins), null, 2);
  //   this.socket.on("message", msg => {
  //     console.log("Recieved message: " + msg);
  //   });
  //   this.socket.emit("test", "teeeestar");
  //   console.log("skickar meddelande");
  // }
}
