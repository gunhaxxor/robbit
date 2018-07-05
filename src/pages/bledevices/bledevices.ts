import { Component, NgZone } from "@angular/core";
import { BleService } from "../../providers/bleservice/BleService";
@Component({
  templateUrl: "bledevices.html"
})
export class BlePage {
  devices: any;
  isConnectedToDevice: any;
  connectedDevice: any;
  constructor(private bleservice: BleService, private zone: NgZone) {}

  ionViewDidLoad() {
    this.devices = this.bleservice.devices;
    this.isConnectedToDevice = this.bleservice.isConnectedToDevice;
    this.connectedDevice = this.bleservice.connectedDevice;
    console.log("DeviceList" + this.devices);
    console.log("started scan!");
    this.bleservice.ConnectedIcon();
    this.bleservice.scan();
  }

  refreshView() {
    console.log("Refreshing view");
    this.zone.run(() => {
      this.connectedDevice = this.bleservice.connectedDevice;
      this.isConnectedToDevice = this.bleservice.isConnectedToDevice;
      this.devices = this.bleservice.devices;
    });
  }

  selectDevice(device) {
    console.log("trying to connect to a microbit");
    // this.bleservice.disconnect();
    this.bleservice.connectToMicrobit(device);
  }

  connectedToDevice(device) {
    console.log("checking if connected to: " + JSON.stringify(device));
    return device == this.connectedDevice;
  }
}
