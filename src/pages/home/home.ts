import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { Platform } from 'ionic-angular/platform/platform';
import { BleService } from "../../providers/bleservice/bleService";
import { DriverInterfacePage } from "../driverInterface/driverInterface";
import { RobotInterfacePage } from "../robotInterface/robotInterface";
// declare let cordova: any;

@Component({
  selector: "page-home",
  templateUrl: "home.html"
})
export class HomePage {
  robotName: string;

  constructor(public navCtrl: NavController, public bleService: BleService, private plt: Platform) {}

  ionViewDidLoad() {
    console.log("this.plt.is('cordova')");
    console.log(this.plt.is('cordova'));
  }

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
    this.navCtrl.push(DriverInterfacePage, {robotName: this.robotName} );
  }
  goToRobotInterface() {
    this.navCtrl.push(RobotInterfacePage, {robotName: this.robotName} );
  }
}
