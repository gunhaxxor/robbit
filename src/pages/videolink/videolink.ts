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

    this.socket.on("messageReceived", this.onMessageReceive);

    this.socket.emit("login", { id: this.userId });
  }

  startCall() {
    this.isCalling = true;
    this.callIgnored = false;
    this.callEnded = false;

    this.socket.emit("sendMessage", {
      id: this.userId,
      peer_id: this.peerId, // peerId?
      type: "call"
    });
  }

  call(isInitiator) {
    let config = {
      isInitiator: isInitiator, // True eller false på Isinitiator
      stun: {
        host: "stun:stun.l.google.com:19302"
      },
      streams: {
        audio: true,
        video: true
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
      this.socket.emit("sendMessage", {
        id: this.userId,
        peer_id: this.peerId,
        type: "phonertc_handshake",
        data: JSON.stringify(data)
      });
    });

    this.session.on("disconnect", () => {
      this.socket.emit("sendMessage", {
        id: this.userId,
        peer_id: this.peerId,
        type: "ignore"
      });
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
      return;
    }

    this.callInProgress = true;

    this.call(false);

    setTimeout(function() {
      this.socket.emit("sendMessage", {
        id: this.userId,
        peer_id: this.peerId,
        type: "answer"
      });
    }, 1500);
  }

  onMessageReceive(message) {
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
        break;

      case "end":
        this.callInProgress = false;
        this.callEnded = true;
        this.callIgnored = false;
        break;
    }
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
