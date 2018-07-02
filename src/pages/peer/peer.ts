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
      // console.log("Startar permissions");
      // androidPermissions.requestPermissions([
      //   androidPermissions.PERMISSION.CAMERA,
      //   androidPermissions.PERMISSION.CALL_PHONE,
      //   androidPermissions.PERMISSION.GET_ACCOUNTS,
      //   androidPermissions.PERMISSION.READ_EXTERNAL_STORAGE,
      //   androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE
      // ]);
    });
  }

  // getCameraPermission() {
  // androidPermissions.requestPermission(android.Manifest.permission.CAMERA, "Needed for connectivity status").then(() => {
  //     console.log("Permission granted!");
  // }).catch(() => {
  //     console.log("Permission is not granted (sadface)");
  // });

  ionViewDidLoad() {
    console.log("user media test page loaded");

    // Prefer camera resolution nearest to 1280x720.
    var constraints = { audio: true, video: true };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(mediaStream => {
        var video = document.querySelector("video");
        video.srcObject = mediaStream;
        // video.onloadedmetadata = function(e) {
        //   video.play();
        // };
      })
      .catch(function(err) {
        console.log(err.name + ": " + err.message);
      }); // always check for errors at the end.

    this.androidPermissions
      .checkPermission(this.androidPermissions.PERMISSION.CAMERA)
      .then(
        result => console.log("Has permission?", result.hasPermission),
        err =>
          this.androidPermissions.requestPermission(
            this.androidPermissions.PERMISSION.CAMERA
          )
      );

    this.androidPermissions
      .requestPermission(this.androidPermissions.PERMISSION.CAMERA)
      .then(
        result => {
          console.log("got it");
          console.log(JSON.stringify(result));
        },
        err => {
          console.log("didn't get it!!!");
          console.log(JSON.stringify(err));
        }
      );
  }
}
