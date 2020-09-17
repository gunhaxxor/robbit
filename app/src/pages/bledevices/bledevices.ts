import { Component, NgZone } from "@angular/core";
import { BleService } from "../../providers/bleservice/bleService";
@Component({
  templateUrl: "bledevices.html"
})
export class BlePage {
  // devices: any;
  // isConnectedToDevice: any;
  // connectedDevice: any;
  // sharedState: any;
  constructor(private bleService: BleService, private zone: NgZone) {
    // this.zone.run(() => {
    //   this.sharedState = this.bleservice.sharedState;
    // });
  }

  ionViewWillEnter() {
    console.log("ska öppna devicelist page");
    this.bleService.scanAndPopulateDeviceArray();

    // this.zone.run(() => {
    //   this.devices = this.bleservice.devices;
    //   this.isConnectedToDevice = this.bleservice.isConnectedToDevice;
    //   this.connectedDevice = this.bleservice.connectedDevice;
    // });
    // console.log("DeviceList" + this.sharedState.devices);
    // this.bleservice.ConnectedIcon();
  }

  // refreshView() {
  //   console.log("Refreshing view");
  //   console.log(JSON.stringify(this.sharedState));
  //   this.zone.run(() => {
  //     this.sharedState = this.bleservice.sharedState;
  //     // this.sharedState.connectedDevice = this.bleservice.sharedState.connectedDevice;
  //     // this.sharedState.isConnectedToDevice = this.bleservice.sharedState.isConnectedToDevice;
  //     // this.sharedState.devices = this.bleservice.sharedState.devices;
  //   });
  // }

  selectDevice(device) {
    console.log("trying to connect to a microbit");
    // this.bleservice.disconnect();
    this.bleService.connectToMicrobit(device);
  }

  // connectedToDevice(device) {
  //   console.log("checking if connected to: " + JSON.stringify(device));
  //   return device == this.sharedState.connectedDevice;
  // }
}
