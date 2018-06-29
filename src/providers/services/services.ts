// import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BLE } from "@ionic-native/ble";
/*
  Generated class for the ServicesProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class ServicesProvider {
  constructor() {
    console.log("GET TO THE CHOOOPPER");
  }

scan() {
    this.setStatus = "Skannar efter bluetooth apparater";
    this.devices = [];
    this.ble.scan([], 7).subscribe(device => this.DevFound(device));
    this.presentloading();
  }
  // When a device is discovered
  DevFound(device) {
    console.log(device.name);
    if (device.name && device.name.includes("micro")) {
      this.devices.push(device);
    }
  }
  // When user selects a device from the array / list
  selecteddevice(device) {
    this.navCtrl.push(RobotControlPage, {
      device: device
    });
  }
}
}