import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { AndroidPermissions } from "@ionic-native/android-permissions";
import { Platform } from "ionic-angular";

@IonicPage()
@Component({
  selector: "page-peer",
  templateUrl: "peer.html"
})
export class PeerPage {
  constructor(
    platform: Platform,
    public navCtrl: NavController,
    public navParams: NavParams,
    private androidPermissions: AndroidPermissions
  ) {
    document.addEventListener("deviceready", () => {
      console.log("hello");
      // peer = new Peer({ key: "lwjd5qra8257b9" });
      console.log("ionViewDidLoad PeerPage");
      this.androidPermissions
        .checkPermission(this.androidPermissions.PERMISSION.CAMERA)
        .then(
          result => console.log("Has permission?", result.hasPermission),
          err =>
            this.androidPermissions.requestPermission(
              this.androidPermissions.PERMISSION.CAMERA
            )
        );

      this.androidPermissions.requestPermissions([
        this.androidPermissions.PERMISSION.CAMERA,
        this.androidPermissions.PERMISSION.GET_ACCOUNTS
      ]);
    });
  }

  ionViewDidLoad() {}
  // peer.on('open', function(id) {
  //   console.log('My peer ID is: ' + id);
  // });
}
