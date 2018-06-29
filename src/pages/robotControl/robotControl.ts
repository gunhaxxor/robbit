import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { LoadingController } from "ionic-angular";
import { BLE } from "@ionic-native/ble";
import { ServicesProvider } from "../../providers/services/services";

@IonicPage()
@Component({
  selector: "page-robotControl",
  templateUrl: "robotControl.html",
  providers: [ServicesProvider]
})
export class RobotControlPage {
  setStatus: any;
  peripheral: any;
  connecteddd: boolean = false;
  uartService: any;
  uartRXCharacteristic: any;
  robotControlIntervalId: any;
  arrowLeftActive: boolean;
  arrowForwardActive: boolean;
  arrowRightActive: boolean;
  arrowBackwardActive: boolean;
  textEncoder: TextEncoder;
  constructor(
    public navCtrl: NavController,
    private ble: BLE,
    public loading: LoadingController,
    public navParams: NavParams,
    public serice: ServicesProvider
  ) {
    let device = navParams.get("device");
    this.setStatus = "Shaking hand with " + device.name + " ID: " + device.id;
    // UUID ex. FF11 = 1 on && 0 off

    this.ble
      .connect(device.id)
      .subscribe(
        peripheral => this.onConnected(peripheral),
        peripheral => this.onDeviceDisconnected(peripheral)
      );

    //initiera vår textencoder så vi kan använda den seeen!!!
    this.textEncoder = new TextEncoder();
  }
  // Loader
  presentloading() {
    const loader = this.loading.create({
      content: "Ansluter till apparat",
      duration: 500
    });
    loader.present();
  }
  onConnected(peripheral) {
    this.presentloading();
    //alert("Handshake complete");
    this.peripheral = peripheral; // Peripheral is the slave
    this.uartService = peripheral.services.find(element => {
      return element.includes("b5a");
    });
    console.log("uartservice:" + JSON.stringify(this.uartService));
    // var found = array1.find(function (element) {
    //   return element > 10;
    // });
    // this.uartService = peripheral.services[3]; // We think this is the uart service
    // Här behöver vi hitta rx charactericicsgrejimojen
    for (let i = 0; i < peripheral.characteristics.length; i++) {
      let currentCrtscs = peripheral.characteristics[i];
      if (currentCrtscs.service == this.uartService) {
        if (currentCrtscs.characteristic.includes("0003")) {
          console.log("Setting RX chracteristic!");
          this.uartRXCharacteristic = currentCrtscs.characteristic;
        }
        console.log(JSON.stringify(currentCrtscs));
      }
    }
    console.log(
      "RX characteristic: " + JSON.stringify(this.uartRXCharacteristic)
    );
    // this.uartRXCharacteristic =
    this.connecteddd = true;
    // console.log(JSON.stringify(peripheral));

    this.robotControlIntervalId = setInterval(() => {
      let forwardAmt = 0;
      let turnAmt = 0;
      let motorValue1 = 0;
      let motorValue2 = 0;
      ///Let's here check if we should send drive stuff to the robot
      if (this.arrowLeftActive) {
        turnAmt -= 1023;
        // this.left();
      }
      if (this.arrowForwardActive) {
        // this.forward();
        forwardAmt += 1023;
      }
      if (this.arrowRightActive) {
        turnAmt += 1023;
        // this.right();
      }
      if (this.arrowBackwardActive) {
        forwardAmt -= 1023;
        // this.backward();
      }
      if (turnAmt == 0) {
        motorValue1 = forwardAmt;
        motorValue2 = forwardAmt;
      } else {
        motorValue1 = forwardAmt / 2 + turnAmt / 2;
        motorValue2 = forwardAmt / 2 - turnAmt / 2;
      }
      // motorValue1 += 1023;
      // motorValue2 += 1023;

      motorValue1 = Math.floor(motorValue1);
      motorValue2 = Math.floor(motorValue2);
      console.log(motorValue1);
      console.log(motorValue2);
      let msg = "" + motorValue1 + ";" + motorValue2 + "\n";
      this.send(msg);
    }, 200);
  }

  onDeviceDisconnected(peripheral) {
    clearInterval(this.robotControlIntervalId);
    this.peripheral = undefined;
    alert("Handshake stopped");
    this.connecteddd = false;
  }

  // //n user is leaving the selected page.
  ionViewWillLeave() {
    this.ble.disconnect(this.peripheral.id);
  }

  ionViewDidLeave() {
    this.peripheral = 0;
  }

  ionViewDidLoad() {
    this.presentloading();
    console.log("ionViewDidLoad SelectedPage");
  }

  send(msg) {
    console.log("Sending Gunnar är sämst: " + msg);
    // let buffer = new Uint8Array([msg]).buffer;
    let buffer = this.textEncoder.encode(msg).buffer;
    if (!this.peripheral || !this.uartService || !this.uartRXCharacteristic) {
      console.error("device, service or characteristic are not set!!");
    }
    this.ble.write(
      this.peripheral.id,
      this.uartService,
      this.uartRXCharacteristic,
      buffer
    );
  }

  logButtonPress(state: boolean) {
    console.log("button " + state);
  }
}
