import { Injectable } from "@angular/core";
import { BLE } from "@ionic-native/ble";
/*
  OUR BLE SERVICE PROVIDER
*/
@Injectable()
export class BleService {
  //Should only contain found uBits
  devices: any[] = [];
  selectedDevice: any = undefined;
  connectedToDevice: boolean = false;
  peripheral: any;
  uartService: any;
  uartRXCharacteristic: any;
  statusMessage: string;
  setStatus: any;
  scanError: any;
  textEncoder: any;

  constructor(private ble: BLE) {
    console.log("GET TO THE CHOOOPPER");
    this.textEncoder = new TextEncoder();
  }

  start() {
    console.log("BLE service started");
    this.scan();
  }

  scan() {
    this.setStatus = "Skannar efter bluetooth apparater";
    console.log(this.setStatus);
    this.devices = [];
    this.ble.scan([], 5).subscribe(device => this.devFound(device));
  }
  // When a device is discovered
  devFound(device) {
    console.log("found device: " + device.name);
    if (device.name && device.name.includes("micro")) {
      if (!this.devices) {
        this.connectToMicrobit(device);
      }
      this.devices.push(device);
    }
  }
  // Goes through found devices and attempts to connect to the first available uBit.
  connectToMicrobit(device) {
    console.log("Connecting to micro:bit");
    this.ble
      .connect(device.id)
      .subscribe(
        peripheral => this.onConnected(peripheral),
        peripheral => this.onDisconnected(peripheral)
      );
  }

  disconnect() {
    if (!this.peripheral) {
      console.error("device is not set. Nothing to disconnect from!");
      return;
    }
    this.ble.disconnect(this.peripheral.id);
  }

  onConnected(peripheral) {
    this.selectedDevice = peripheral;
    this.connectedToDevice = true;
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

  send(msg) {
    console.log("Sending Gunnar är sämst: " + msg);
    // let buffer = new Uint8Array([msg]).buffer;
    let buffer = this.textEncoder.encode(msg).buffer;
    if (!this.peripheral || !this.uartService || !this.uartRXCharacteristic) {
      console.error("device, service or characteristic are not set!!");
      return;
    }
    this.ble.write(
      this.peripheral.id,
      this.uartService,
      this.uartRXCharacteristic,
      buffer
    );
  }
  // When connection to the selected device suddenly stops.
  onDisconnected(peripheral) {
    this.peripheral = undefined;
    alert("Handshake stopped");
    //  this.connecteddd = false;
  }
}
