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
  public video: any;
  private stream: any;

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
    this.video = document.querySelector("video");
    const constraints = {
      audio: false,
      video: {
        width: { min: 1024, ideal: 1280, max: 1920 },
        height: { min: 776, ideal: 720, max: 1080 },
        facingMode: "environment"
      }
    };

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      console.log("Found the getUserMedia API in the context");
      navigator.mediaDevices
        .getUserMedia(constraints)
        .then(stream => {
          this.video.src = window.URL.createObjectURL(stream);
          this.stream = stream;
          this.video.play();
        })
        .catch(function(err) {
          console.error(err.name + ": " + err.message);
        });
    } else {
      console.error("Your browser does not support the mediaDevices API");
    }
  }

  requestCameraPermission() {
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

    // const options: CameraOptions = {
    //   quality: 100,
    //   destinationType: this.camera.DestinationType.FILE_URI,
    //   encodingType: this.camera.EncodingType.JPEG,
    //   mediaType: this.camera.MediaType.PICTURE
    // };

    // this.camera.getPicture(options).then(
    //   imageData => {
    //     // imageData is either a base64 encoded string or a file URI
    //     // If it's base64 (DATA_URL):
    //     let base64Image = "data:image/jpeg;base64," + imageData;
    //   },
    //   err => {
    //     // Handle error
    //   }
    // );
  }

  ionViewDidLoad() {
    console.log("user media test page loaded");
  }
}
