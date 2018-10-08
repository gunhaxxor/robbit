import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { BleService } from "../../providers/bleservice/bleService";
import { DriverInterfacePage } from "../driverInterface/driverInterface";
import { RobotInterfacePage } from "../robotInterface/robotInterface";
import { testPage } from "../test/test";
// declare let cordova: any;

@Component({
  selector: "page-home",
  templateUrl: "home.html"
})
export class HomePage {
  constructor(public navCtrl: NavController, public bleService: BleService) {}

  ionViewDidLoad() {}

  // changed() {
  //   if (!this.toggleValue) {
  //     console.log("Control mode on");
  //     this.bleService.sharedState.isConnectedToDevice = true;
  //   } else {
  //     console.log("Buetooth mode on");
  //     this.bleService.sharedState.isConnectedToDevice = false;
  //   }
  // }

  goToDriverInterface() {
    this.bleService.isRobot = true;
    this.navCtrl.push(DriverInterfacePage);
  }
  goToRobotInterface() {
    this.bleService.isRobot = false;
    this.navCtrl.push(RobotInterfacePage);
  }
}
