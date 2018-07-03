import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { AndroidPermissions } from "@ionic-native/android-permissions";
import { Platform } from "ionic-angular";
import { Camera, CameraOptions } from "@ionic-native/camera";

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
    private androidPermissions: AndroidPermissions,
    private camera: Camera
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

  requestUserMedia() {
    var constraints = { audio: true, video: true };
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(mediaStream => {
        console.log("got mediadevice!");
        var video = document.querySelector("video");
        video.srcObject = mediaStream;
        // video.onloadedmetadata = function(e) {
        //   video.play();
        // };
      })
      .catch(function(err) {
        console.log("error vid mediadevice request");
        console.log(err.name + ": " + err.message);
      }); // always check for errors at the end.
  }

  cameraTriggered() {
    // Prefer camera resolution nearest to 1280x720.

    // this.androidPermissions
    //   .checkPermission(this.androidPermissions.PERMISSION.CAMERA)
    //   .then(
    //     result => console.log("Has permission?", result.hasPermission),
    //     err =>
    //       this.androidPermissions.requestPermission(
    //         this.androidPermissions.PERMISSION.CAMERA
    //       )
    //   );

    // this.androidPermissions
    //   .requestPermission(this.androidPermissions.PERMISSION.CAMERA)
    //   .then(
    //     result => {
    //       console.log("got it");
    //       console.log(JSON.stringify(result));
    //     },
    //     err => {
    //       console.log("didn't get it!!!");
    //       console.log(JSON.stringify(err));
    //     }
    //   );
    const options: CameraOptions = {
      quality: 100,
      destinationType: this.camera.DestinationType.FILE_URI,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE
    };

    this.camera.getPicture(options).then(
      imageData => {
        // imageData is either a base64 encoded string or a file URI
        // If it's base64 (DATA_URL):
        let base64Image = "data:image/jpeg;base64," + imageData;
      },
      err => {
        // Handle error
      }
    );
    // const options: CameraOptions = {
    //   quality: 100,
    //   destinationType: this.camera.DestinationType.FILE_URI,
    //   encodingType: this.camera.EncodingType.JPEG,
    //   mediaType: this.camera.MediaType.PICTURE
    // }

    // this.camera.getPicture(options).then((imageData) => {
    //  // imageData is either a base64 encoded string or a file URI
    //  // If it's base64 (DATA_URL):
    //  let base64Image = 'data:image/jpeg;base64,' + imageData;
    // }, (err) => {
    //  // Handle error
    // });
  }

  ionViewDidLoad() {
    console.log("user media test page loaded");
  }
}
