import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { BLE } from "@ionic-native/ble";
//import { RobotControlPage } from "../robotControl/robotControl";
import { BleService } from "../../providers/bleservice/BleService";

@Component({
  selector: "page-contact",
  templateUrl: "deviceList.html"
})
export class DeviceListPage {
  constructor(
    public navCtrl: NavController,
    private ble: BLE,
    public bleService: BleService
  ) {}
}
