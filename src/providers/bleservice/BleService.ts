import { Injectable } from "@angular/core";
import { BLE } from "@ionic-native/ble";
import encoding from "text-encoding";
// import { Diagnostic } from "@ionic-native/diagnostic";
// declare let cordova: any;
/*
  OUR BLE SERVICE PROVIDER
*/
@Injectable()
export class BleService {
  //Should only contain found uBits
  devices: any[] = [];
  connectedDevice: any = undefined;
  isConnectedToDevice: boolean = false;

  uartService: any;
  uartRXCharacteristic: any;
  statusMessage: string;
  scanError: any;
  textEncoder: any;
  constructor(private ble: BLE) {
    console.log("bleService Started");
    this.textEncoder = new encoding.TextEncoder();
  }

  public start() {
    this.scanAndAutoConnect();
    console.log("Starting BLE scan");
  }

  public scan() {
    let status = "Skannar efter uBits";
    console.log(status);
    this.devices = [];
    this.ble.scan([], 10).subscribe(device => {
      if (device.name && device.name.includes("micro")) {
        this.devices.push(device);
      }
    });
  }

  public scanAndAutoConnect() {
    let status = "Letar efter enhet att automatiskt ansluta till";
    console.log(status);
    this.devices = [];
    this.ble.scan([], 7).subscribe(device => this.devFound(device));
    setTimeout(() => {
      if (!this.isConnectedToDevice) {
        this.scanAndAutoConnect();
      }
    }, 10000);
  }

  // When a device is discovered
  private devFound(device) {
    console.log("found device: " + device.name);
    if (device.name && device.name.includes("micro")) {
      this.devices.push(device);
      //Automatically connect to the first uBit in the list
      if (this.devices.length < 2 && !this.isConnectedToDevice) {
        this.connectToMicrobit(device);
        console.log("Hittat och ansluter till micro:bit");
      }
    }
  }
  // Goes through found devices and attempts to connect to the first available uBit.
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
    console.log("disconnecting from: " + JSON.stringify(this.connectedDevice));
    this.ble.disconnect(this.connectedDevice.id);
  }

  send(msg) {
    console.log("Sending Gunnar är sämst: " + msg);
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
    console.log("Ansluten till enhet");
    this.isConnectedToDevice = true;
    this.ConnectedIcon();
    this.connectedDevice = peripheral;
    this.uartService = peripheral.services.find(element => {
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
    this.connectedDevice = undefined;
    // alert("Handshake stopped");
    this.isConnectedToDevice = false;
    this.ConnectedIcon();
    this.start();
  }

  ConnectedIcon() {
    if (this.isConnectedToDevice) {
      // document.getElementById("bleicon").style.backgroundColor = "green";
      // document.getElementById("spinner").style.display = "none";
    } else {
      // document.getElementById("bleicon").style.backgroundColor = "red";
      // document.getElementById("spinner").style.display = "block";
    }
  }
}
