import { Injectable, ApplicationRef } from "@angular/core";
import { BLE } from "@ionic-native/ble";
import encoding from "text-encoding";

// declare let cordova: any;
/*
  OUR BLE SERVICE PROVIDER
*/
@Injectable()
export class BleService {
  statusMessage: string;
  scanError: any;
  textEncoder: any;

  uartService: any;
  uartRXCharacteristic: any;

  devices: any[] = [];
  connectedDevice: any = undefined;
  public isConnectedToDevice: boolean = false;
  private started: boolean = false;

  constructor(private ble: BLE, private appRef: ApplicationRef) {
    console.log("bleService instantiated");
    this.textEncoder = new encoding.TextEncoder();
  }

  public start() {
    if (this.started) {
      console.log("Scan already active");
      return;
    }
    this.started = true;
    this.scanAndAutoConnect();
    console.log("Starting BLE scan");
  }

  public stop() {
    this.started = false;

    this.ble.stopScan();
    this.disconnect();
  }

  public scanAndPopulateDeviceArray() {
    console.log("Skannar efter uBits");
    this.devices = [];
    this.ble.scan([], 7).subscribe(device => {
      //console.log("found device named: " + device.name);
      if (device.name && device.name.includes("micro")) {
        console.log("found uBit device: " + device.name);
        this.devices.push(device);
      }
    });
  }

  public scanAndAutoConnect() {
    // if (this.HomePage.toggleValue) {
    // Tillagt för att inte påbörja skanningen av bluetooth devices om lärarmode inte är aktiverat!
    console.log("Letar efter enhet att automatiskt ansluta till");
    this.devices = [];
    this.ble.startScan([]).subscribe(device => {
      this.devFound(device);
    });
  }

  // When a device is discovered
  private devFound(device) {
    // console.log("found BLE device named: " + device.name);
    if (device.name && device.name.includes("micro")) {
      this.devices.push(device);
      //Automatically connect to the first uBit in the list
      if (this.devices.length == 1 && !this.isConnectedToDevice) {
        this.ble.stopScan();
        this.connectToMicrobit(device);
        console.log("Hittat och ansluter till micro:bit");
      }
    }
  }
  // Attempts to connect to the specified device.
  connectToMicrobit(device) {
    if (this.isConnectedToDevice) {
      console.log("was already connected to a BLE device. First disconnects!");
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
      console.error("BLE device is not set. Nothing to disconnect from!");
      return;
    }
    console.log(
      "disconnecting from: " + JSON.stringify(this.connectedDevice.name)
    );
    this.ble.disconnect(this.connectedDevice.id);
    this.isConnectedToDevice = false;
  }

  public send(msg) {
    // let buffer = new Uint8Array([msg]).buffer;
    let buffer = this.textEncoder.encode(msg).buffer;
    if (
      !this.connectedDevice ||
      !this.uartService ||
      !this.uartRXCharacteristic
    ) {
      // console.error("device, service or characteristic are not set!!");
      return;
    }
    console.log("skickar till uBit: " + msg);
    this.ble.write(
      this.connectedDevice.id,
      this.uartService,
      this.uartRXCharacteristic,
      buffer
    );
  }

  private onConnected(peripheral) {
    console.log("Ansluten till enhet " + peripheral.id);
    this.connectedDevice = peripheral;
    this.isConnectedToDevice = true;
    this.uartService = peripheral.services.find(element => {
      return element.includes("b5a");
    });
    if (!this.uartService) {
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
      }
    }
    console.log(
      "RX characteristic: " + JSON.stringify(this.uartRXCharacteristic)
    );

    this.appRef.tick();
  }

  // When connection to the selected device suddenly stops.
  private onDisconnected(peripheral) {
    console.log("disconnected from: " + JSON.stringify(peripheral));
    this.isConnectedToDevice = false;
    this.connectedDevice = undefined;
    if (this.started) {
      this.scanAndAutoConnect();
    }

    this.appRef.tick();
  }
}
