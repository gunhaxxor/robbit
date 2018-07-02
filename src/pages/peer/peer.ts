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
    platform.ready().then(() => {
      console.log("Startar permissions");
      androidPermissions.requestPermissions([
        androidPermissions.PERMISSION.CAMERA,
        androidPermissions.PERMISSION.CALL_PHONE,
        androidPermissions.PERMISSION.GET_ACCOUNTS,
        androidPermissions.PERMISSION.READ_EXTERNAL_STORAGE,
        androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE
      ]);
    });
  }

  // getCameraPermission() {
  // androidPermissions.requestPermission(android.Manifest.permission.CAMERA, "Needed for connectivity status").then(() => {
  //     console.log("Permission granted!");
  // }).catch(() => {
  //     console.log("Permission is not granted (sadface)");
  // });

  ionViewDidLoad() {}
  // peer.on('open', function(id) {
  //   console.log('My peer ID is: ' + id);
  // });
}
