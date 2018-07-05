import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { BleService } from "../../providers/bleservice/BleService";
// import { Diagnostic } from "@ionic-native/diagnostic";
declare let cordova: any;

@Component({
  selector: "page-home",
  templateUrl: "home.html"
})
export class HomePage {
  constructor(
    public navCtrl: NavController,
    public bleService: BleService // private diagnostic: Diagnostic
  ) {}

  localproperty: boolean = false;

  changeLocalProperty() {
    this.localproperty = !this.localproperty;
  }
  // ionViewDidLoad() {
  //   console.log("Ble service startas automatiskt");
  //   this.bleService.start();
  // }

  // $this.beginStateCheckFn();
  // $this.diagnostic.isCameraAuthorized().then((authorized) => {
  //   if ($this.cameraAuthorized !== authorized) {
  //     $this.stateChanged = true;
  //   }
  //   $this.cameraAuthorized = authorized;
  //   $this.endStateCheckFn();
  // }, $this.onStateCheckError).catch ($this.onStateCheckError);

  cameraAuthCheck() {
    // this.diagnostic
    //   .requestCameraAuthorization(false)
    //   .then(
    //     () => {
    //       // this.checkState();
    //       console.log("we got dice!!");
    //     },
    //     err => console.log("no dice!" + err)
    //   )
    //   .catch(err => console.log("no dice" + err));
    // if (this.diagnostic.isCameraAuthorized()) {
    //   console.log(
    //     "Du har permission!" +
    //       JSON.stringify(this.diagnostic.isCameraAuthorized())
    //   );
    // } else {
    //   this.diagnostic.requestCameraAuthorization();
    //   console.log("Ansöker om ledighet");
    // }
    // cordova.plugins.diagnostic.getCameraAuthorizationStatus(status => {
    //   if (status === cordova.plugins.diagnostic.permissionStatus.GRANTED) {
    //     console.log("Camera use is authorized");
    //   } else {
    //     console.log("Du har ingen ledighet!");
    //   }
    // });
  }
  ionViewDidLoad() {
    console.log("hi");
    this.bleService.ConnectedIcon();
  }
}
