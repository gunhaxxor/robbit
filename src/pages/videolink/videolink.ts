import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams, Platform } from "ionic-angular";

declare let cordova: any;
@IonicPage()
@Component({
  selector: "page-videolink",
  templateUrl: "videolink.html"
})
export class VideolinkPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public platform: Platform
  ) {
    this.platform.ready().then(() => {
      //this is very important
      console.log("printing phonertc object");
      console.log(cordova.plugins.phonertc);
    });
  }

  config = {
    isInitiator: true,
    turn: {
      host: "",
      username: "",
      password: ""
    },
    streams: {
      audio: true,
      video: false
    }
  };

  //session = new cordova.plugins.phonertc.Session(this.config);

  ionViewDidLoad() {
    console.log("ionViewDidLoad VideolinkPage");
    console.log(JSON.stringify(cordova.plugins), null, 2);
  }
}
