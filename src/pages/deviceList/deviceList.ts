import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
//import { RobotControlPage } from "../robotControl/robotControl";
import { BleService } from "../../providers/bleservice/bleService";

@Component({
  selector: "page-contact",
  templateUrl: "deviceList.html"
})
export class DeviceListPage {
  constructor(public navCtrl: NavController, public bleService: BleService) {}
}
