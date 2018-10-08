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

  // public sharedState: any = {
  //   //Should only contain found uBits
  //   devices: <any[]>[],
  //   connectedDevice: <any>undefined,
  //   isConnectedToDevice: <boolean>false
  // };

  uartService: any;
  uartRXCharacteristic: any;

  devices: any[] = [];
  connectedDevice: any = undefined;
  public isConnectedToDevice: boolean = false;


  public isRobot: boolean = false; // False = Client, True = Host

  constructor(private ble: BLE, private zone: NgZone) {
    console.log("bleService instantiated");
    this.textEncoder = new encoding.TextEncoder();
  }

  public start() {
    this.scanAndAutoConnect();
    console.log("Starting BLE scan");
  }

  public scanAndPopulateDeviceArray() {
    console.log("Skannar efter uBits");
    // this.sharedState.devices = [];
    this.devices = [];
    this.ble.scan([], 7).subscribe(device => {
      console.log("found device named: " + device.name);
      if (device.name && device.name.includes("micro")) {
        console.log("found uBit device: " + device.name);
        // this.sharedState.devices.push(device);
        this.devices.push(device);
      }
    });
  }

  public scanAndAutoConnect() {
    // if (this.HomePage.toggleValue) {
    // Tillagt för att inte påbörja skanningen av bluetooth devices om lärarmode inte är aktiverat!
    console.log("Letar efter enhet att automatiskt ansluta till");
    this.devices = [];
    this.ble.scan([], 7).subscribe(device => this.devFound(device));
    setTimeout(() => {
      if (!this.isConnectedToDevice) {
        console.log("Ska nu skanna igen från timeout");
        this.scanAndAutoConnect();
      }
    }, 8000);
    // }
  }

  // When a device is discovered
  private devFound(device) {
    console.log("found device named: " + device.name);
    if (device.name && device.name.includes("micro")) {
      // this.zone.run(() => {
        this.devices.push(device);
      // });
      //Automatically connect to the first uBit in the list
      if (
        this.devices.length == 1 &&
        !this.isConnectedToDevice
      ) {
        this.connectToMicrobit(device);
        console.log("Hittat och ansluter till micro:bit");
      }
    }
  }
  // Attempts to connect to the specified device.
  connectToMicrobit(device) {
    if (this.isConnectedToDevice) {
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
    if (!this.connectedDevice) {
      console.error("device is not set. Nothing to disconnect from!");
      return;
    }
    console.log(
      "disconnecting from: " + JSON.stringify(this.connectedDevice)
    );
    this.ble.disconnect(this.connectedDevice.id);
    this.isConnectedToDevice = false;
    // this.ConnectedIcon();
  }

  public send(msg) {
    console.log("skickar till uBit: " + msg);
    // let buffer = new Uint8Array([msg]).buffer;
    let buffer = this.textEncoder.encode(msg).buffer;
    if (
      !this.connectedDevice ||
      !this.uartService ||
      !this.uartRXCharacteristic
    ) {
      console.error("device, service or characteristic are not set!!");
      return;
    }
    this.ble.write(
      this.connectedDevice.id,
      this.uartService,
      this.uartRXCharacteristic,
      buffer
    );
  }

  private onConnected(peripheral) {
    console.log("Ansluten till enhet " + peripheral.id);
    this.isConnectedToDevice = true;
    // this.ConnectedIcon();
    this.connectedDevice = peripheral;
    this.uartService = peripheral.services.find(element => {
      return element.includes("b5a");
    });
    if(!this.uartService){
      console.log("didn't find the uart service!");
    }
    console.log("uartservice is: " + JSON.stringify(this.uartService));

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
    this.connectedDevice = undefined;
    // alert("Handshake stopped");
    this.isConnectedToDevice = false;
    // this.ConnectedIcon();
  }

  // // TODO: This should be replaced later with a proper state change detection instead of manually tiggering changes
  // public ConnectedIcon() {
  //   if (this.isConnectedToDevice) {
  //     document.getElementById("ble").style.backgroundColor = "green";
  //   } else {
  //     document.getElementById("ble").style.backgroundColor = "red";
  //   }
  // }
}
