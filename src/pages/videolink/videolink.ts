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

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public platform: Platform,
    public bleService: BleService,
    private socket: Socket
  ) {
    socket.on("messageReceived", this.onVideoMessageReceived);
    socket.on("onMessage", function(message) {
      this.session.receiveMessage(message);
    });
  }

  config: any;
  call(isInitiator) {
    this.config = {
      isInitiator: true,
      turn: {
        host: "",
        username: "",
        password: ""
      },
      streams: {
        audio: true,
        video: true
      }
    };

    this.session = new cordova.plugins.phonertc.Session(this.config);
    cordova.plugins.phonertc.setVideoView({
      container: document.getElementById("videoContainer"),
      local: {
        position: [0, 0],
        size: [100, 100]
      }
    });
    this.session.on("sendMessage", function(data) {
      this.socket.emit("sendMessage", {
        type: "phonertc_handshake",
        data: JSON.stringify(data)
      });
    });
    this.session.call();
  }

  onVideoMessageReceived(message) {
    switch (message.type) {
      case "call":
        break;
      case "answer":
        this.call(true);
        break;
      case "phonertc_handshake":
        // run this only once during the start of a call
        this.session.receiveMessage(JSON.parse(message.data));
        break;
    }
  }

  ionViewDidLoad() {
    this.bleService.ConnectedIcon();
    console.log("ionViewDidLoad VideolinkPage");
    // console.log(JSON.stringify(cordova.plugins), null, 2);
    this.socket.on("message", msg => {
      console.log("Recieved message: " + msg);
    });
    this.socket.emit("message", "teeeestar");
  }
}
