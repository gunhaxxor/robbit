import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { LoadingController } from "ionic-angular";
import { BleService } from "../../providers/bleservice/BleService";
// import encoding from 'text-encoding';

@IonicPage()
@Component({
  selector: "page-robotControl",
  templateUrl: "robotControl.html"
  // providers: [BleService]
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
  // textEncoder: encoding.TextEncoder;
  constructor(
    public navCtrl: NavController,
    public loading: LoadingController,
    public navParams: NavParams,
    public bleService: BleService
  ) {}

  //user is leaving the selected page.
  ionViewWillLeave() {
    clearInterval(this.robotControlIntervalId);
  }

  ionViewDidLeave() {}
  ionViewDidLoad() {
    console.log("ionViewDidLoad SelectedPage");

    this.robotControlIntervalId = setInterval(() => {
      if (this.bleService.isConnectedToDevice) {
        let forwardAmt = 0;
        let turnAmt = 0;
        ///Let's check here if we are available to send drive instructions to selected robot.
        if (this.arrowLeftActive) {
          turnAmt -= 1023;
        }
        if (this.arrowForwardActive) {
          forwardAmt += 1023;
        }
        if (this.arrowRightActive) {
          turnAmt += 1023;
        }
        if (this.arrowBackwardActive) {
          forwardAmt -= 1023;
        }
        let motorValue1 = forwardAmt / 2 + turnAmt / 2;
        let motorValue2 = forwardAmt / 2 - turnAmt / 2;
        motorValue1 = Math.floor(motorValue1);
        motorValue2 = Math.floor(motorValue2);
        console.log(motorValue1);
        console.log(motorValue2);
        let msg = "" + motorValue1 + ";" + motorValue2 + "\n";
        this.bleService.send(msg);
      }
    }, 200);
  }

  logButtonPress(state: boolean) {
    console.log("button " + state);
  }
}
