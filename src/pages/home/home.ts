import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { BleService } from "../../providers/bleservice/BleService";
import { RobotControlPage } from "../robotControl/robotControl";
// declare let cordova: any;

@Component({
  selector: "page-home",
  templateUrl: "home.html"
})
export class HomePage {
  constructor(public navCtrl: NavController, public bleService: BleService) {}

  localproperty: boolean = false;

  changeLocalProperty() {
    this.localproperty = !this.localproperty;
  }
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
  }

  public toggleValue: boolean = false;
  changed() {
    if (!this.toggleValue) {
      console.log("Control mode on");
      this.bleService.sharedState.isConnectedToDevice = true;
    } else {
      console.log("Buetooth mode on");
      this.bleService.sharedState.isConnectedToDevice = false;
    }
  }

  btn1() {
    this.bleService.userStatus = true;
    this.navCtrl.push(RobotControlPage);
  }
  btn2() {
    this.bleService.userStatus = false;
    this.navCtrl.push(RobotControlPage);
  }
}
