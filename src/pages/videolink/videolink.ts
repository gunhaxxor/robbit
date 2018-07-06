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
  isCalling: boolean = false;
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

    this.socket.on("messageReceived", msg => {
      this.onMessageReceive(msg);
    });

    this.socket.emit("login", { id: this.userId });
    console.log("loggar in på signnalservern");
  }

  startCall() {
    console.log("Ringer!");
    this.isCalling = true;
    this.callIgnored = false;
    this.callEnded = false;

    this.socket.emit("sendMessage", {
      id: this.userId,
      peer_id: this.peerId,
      type: "call"
    });
  }

  call(isInitiator) {
    console.log("Call function triggered. isInitiator=" + isInitiator);
    let config = {
      isInitiator: isInitiator, // True eller false på Isinitiator
      stun: {
        host: "stun:stun.l.google.com:19302"
      },
      turn: {
        url: "turn:user@54.197.33.120:3478",
        credential: "root"
      },
      streams: {
        audio: true,
        video: false
      }
    };

    this.session = new cordova.plugins.phonertc.Session(config);
    cordova.plugins.phonertc.setVideoView({
      container: document.getElementById("video-container"),
      local: {
        position: [0, 0],
        size: [100, 100]
      }
    });

    this.session.on("sendMessage", data => {
      console.log();
      this.socket.emit("sendMessage", {
        id: this.userId,
        peer_id: this.peerId,
        type: "phonertc_handshake",
        data: JSON.stringify(data)
      });
    });

    this.session.on("answer", function() {
      console.log("Other client answered!");
    });

    this.session.on("disconnect", () => {
      this.socket.emit("sendMessage", {
        id: this.userId,
        peer_id: this.peerId,
        type: "ignore"
      });
      console.log("Other client disconnected!");
    });

    this.session.call();
  }

  ignore() {
    if (JSON.stringify(this.session) === "{}") {
      this.session.disconnect();
    } else {
      this.socket.emit("sendMessage", {
        id: this.userId,
        peer_id: this.peerId,
        type: "ignore"
      });
    }
  }

  end() {
    this.session.close();
    this.session = {};

    this.socket.emit("sendMessage", {
      is: this.userId,
      peer_id: this.peerId,
      type: "end"
    });

    this.callInProgress = false;
    this.callEnded = true;
  }

  answer() {
    if (this.callInProgress) {
      console.log("can't answer since callInProgress is true");
      return;
    }

    this.callInProgress = true;

    this.call(false);

    setTimeout(() => {
      this.socket.emit("sendMessage", {
        id: this.userId,
        peer_id: this.peerId,
        type: "answer"
      });
    }, 1500);
  }

  onMessageReceive(message) {
    console.log(
      "Received message from signal server: " + JSON.stringify(message)
    );
    switch (message.type) {
      case "answer":
        this.callInProgress = true;
        this.peerId = message.id;
        this.call(true);
        break;

      case "ignore":
        this.callInProgress = false;
        this.callIgnored = true;
        this.callEnded = false;
        break;

      case "phonertc_handshake":
        this.session.receiveMessage(JSON.parse(message.data));
        break;

      case "call":
        this.isCalling = false;
        this.callIgnored = false;
        this.callEnded = false;
        this.peerId = message.id;
        this.answer();
        break;

      case "end":
        this.callInProgress = false;
        this.callEnded = true;
        this.callIgnored = false;
        break;
    }
  }

  ionViewDidLoad() {
    this.bleService.ConnectedIcon();
    console.log("ionViewDidLoad VideolinkPage");
  }
}
// c1efa933 => Samuels
// 09882a9b028aa8e8 => Nexus 5
