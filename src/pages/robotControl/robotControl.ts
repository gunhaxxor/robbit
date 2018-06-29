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
      ///Let's here check if we should send drive stuff to the robot
      if (this.arrowLeftActive) {
        this.left();
      } else if (this.arrowForwardActive) {
        this.forward();
      } else if (this.arrowRightActive) {
        this.right();
      } else if (this.arrowBackwardActive) {
        this.backward();
      } else {
        this.stop();
      }
    }, 100);
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
    console.log("gonna send BLE stuuufffzzz!");
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

  forward() {
    var msg: string = "0102301023";
    this.send(msg);
  }
  backward() {
    var msg: string = "-1023-1023";
    this.send(msg);
  }
  left() {
    var msg: string = "-102301023";
    this.send(msg);
  }
  right() {
    var msg: string = "01023-1023";
    this.send(msg);
  }
  stop() {
    var msg: string = "0000000000";
    this.send(msg);
  }
}
