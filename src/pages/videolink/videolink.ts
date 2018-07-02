import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";

declare let cordova: any;
/**
 * Generated class for the VideolinkPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: "page-videolink",
  templateUrl: "videolink.html"
})
export class VideolinkPage {
  constructor(public navCtrl: NavController, public navParams: NavParams) {}

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
