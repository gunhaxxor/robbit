import { Injectable, NgZone } from "@angular/core";
import { BLE } from "@ionic-native/ble";
import encoding from "text-encoding";
// import { Diagnostic } from "@ionic-native/diagnostic";
// declare let cordova: any;
/*
  OUR BLE SERVICE PROVIDER
*/
@Injectable()
export class BleService {
  statusMessage: string;
  scanError: any;
  textEncoder: any;

  public sharedState: any = {
    //Should only contain found uBits
    devices: <any[]>[],
    connectedDevice: <any>undefined,
    isConnectedToDevice: <boolean>false
  };
  uartService: any;
  uartRXCharacteristic: any;

  isRobot: boolean = false; // False = Client, True = Host

  constructor(private ble: BLE, private zone: NgZone) {
    console.log("bleService instantiated");
    this.textEncoder = new encoding.TextEncoder();
  }

  public start() {
    this.scanAndAutoConnect();
    console.log("Starting BLE scan");
  }

  public scan() {
    console.log("Skannar efter uBits");
    this.sharedState.devices = [];
    this.ble.scan([], 7).subscribe(device => {
      if (device.name && device.name.includes("micro")) {
        console.log("found device: " + device.name);
        this.sharedState.devices.push(device);
      }
    });
  }

  public scanAndAutoConnect() {
    // if (this.HomePage.toggleValue) {
    // Tillagt för att inte påbörja skanningen av bluetooth devices om lärarmode inte är aktiverat!
    console.log("Letar efter enhet att automatiskt ansluta till");
    this.sharedState.devices = [];
    this.ble.scan([], 7).subscribe(device => this.devFound(device));
    setTimeout(() => {
      if (!this.sharedState.isConnectedToDevice) {
        console.log("Ska nu skanna igen från timeout");
        this.scanAndAutoConnect();
      }
    }, 5000);
    // }
  }

  // When a device is discovered
  private devFound(device) {
    console.log("found device: " + device.name);
    if (device.name && device.name.includes("micro")) {
      this.zone.run(() => {
        this.sharedState.devices.push(device);
      });
      //Automatically connect to the first uBit in the list
      if (
        this.sharedState.devices.length < 2 &&
        !this.sharedState.isConnectedToDevice
      ) {
        this.connectToMicrobit(device);
        console.log("Hittat och ansluter till micro:bit");
      }
    }
  }
  // Goes through found devices and attempts to connect to the first available uBit.
  connectToMicrobit(device) {
    if (this.sharedState.isConnectedToDevice) {
      console.log("was already connected to a device. First disconnects!");
      this.disconnect();
    }
    console.log("Connecting to micro:bit");
    this.ble
      .connect(device.id)
      .subscribe(
        peripheral => this.onConnected(peripheral),
        peripheral => this.onDisconnected(peripheral)
      );
  }

  public disconnect() {
    if (!this.sharedState.connectedDevice) {
      console.error("device is not set. Nothing to disconnect from!");
      return;
    }
    console.log(
      "disconnecting from: " + JSON.stringify(this.sharedState.connectedDevice)
    );
    this.ble.disconnect(this.sharedState.connectedDevice.id);
    this.sharedState.isConnectedToDevice = false;
    this.ConnectedIcon();
  }

  public send(msg) {
    console.log("skickar till uBit: " + msg);
    // let buffer = new Uint8Array([msg]).buffer;
    let buffer = this.textEncoder.encode(msg).buffer;
    if (
      !this.sharedState.connectedDevice ||
      !this.uartService ||
      !this.uartRXCharacteristic
    ) {
      console.error("device, service or characteristic are not set!!");
      return;
    }
    this.ble.write(
      this.sharedState.connectedDevice.id,
      this.uartService,
      this.uartRXCharacteristic,
      buffer
    );
  }

  private onConnected(peripheral) {
    console.log("Ansluten till enhet " + peripheral.id);
    this.sharedState.isConnectedToDevice = true;
    this.ConnectedIcon();
    this.sharedState.connectedDevice = peripheral;
    this.uartService = peripheral.services.find(element => {
      console.log("didn't find the uart service!");
      return element.includes("b5a");
    });
    console.log("uartservice:" + JSON.stringify(this.uartService));

    // Här behöver vi hitta rx charactericicsgrejimojen
    for (let i = 0; i < peripheral.characteristics.length; i++) {
      let currentCrtscs = peripheral.characteristics[i];
      if (currentCrtscs.service == this.uartService) {
        if (currentCrtscs.characteristic.includes("0003")) {
          console.log("Setting RX chracteristic!");
          this.uartRXCharacteristic = currentCrtscs.characteristic;
        }
        // console.log(JSON.stringify(currentCrtscs));
      }
    }
    console.log(
      "RX characteristic: " + JSON.stringify(this.uartRXCharacteristic)
    );
  }

  // When connection to the selected device suddenly stops.
  private onDisconnected(peripheral) {
    console.log("disconnected from: " + JSON.stringify(peripheral));
    this.sharedState.connectedDevice = undefined;
    // alert("Handshake stopped");
    this.sharedState.isConnectedToDevice = false;
    this.ConnectedIcon();
  }

  // TODO: This should be replaced later with a proper state change detection instead of manually tiggering changes
  public ConnectedIcon() {
    if (this.sharedState.isConnectedToDevice) {
      document.getElementById("ble").style.backgroundColor = "green";
    } else {
      document.getElementById("ble").style.backgroundColor = "red";
    }
  }
}
