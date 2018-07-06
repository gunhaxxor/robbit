import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams } from "ionic-angular";
import { LoadingController } from "ionic-angular";
import { BleService } from "../../providers/bleservice/BleService";
import { Socket } from "ng-socket-io";
// import encoding from 'text-encoding';

@IonicPage()
@Component({
  selector: "page-robotControl",
  templateUrl: "robotControl.html"
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
  servoUpActive: boolean;
  servoDownActive: boolean;
  // textEncoder: encoding.TextEncoder;
  constructor(
    public navCtrl: NavController,
    public loading: LoadingController,
    public navParams: NavParams,
    public bleService: BleService,
    private socket: Socket
  ) {
    socket.on("robotControl", msg => {
      console.log("received socket msg: " + JSON.stringify(msg));
      this.bleService.send(msg);
    });
  }

  //user is leaving the selected page.
  ionViewWillLeave() {
    clearInterval(this.robotControlIntervalId);
  }
  ionViewDidEnter() {
    if (this.bleService.sharedState.isConnectedToDevice) {
      console.log(
        "skipping socket emit interval loop because we are connected to BLE"
      );
      return;
    }
    let servo = 165;
    console.log("ionViewWillEnter triggered");
    this.robotControlIntervalId = setInterval(() => {
      if (!this.bleService.sharedState.isConnectedToDevice) {
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

        if (this.servoUpActive) {
          servo += 15;
        }
        if (this.servoDownActive) {
          servo -= 15;
        }

        servo = Math.max(85, Math.min(165, servo));

        let motorValue1 = forwardAmt / 2 + turnAmt / 2;
        let motorValue2 = forwardAmt / 2 - turnAmt / 2;
        motorValue1 = Math.floor(motorValue1);
        motorValue2 = Math.floor(motorValue2);
        let msg = "" + motorValue1 + ";" + motorValue2 + ";" + servo + "\n";

        console.log("sending robot data to socket");
        this.socket.emit("robotControl", msg);
      }
    }, 200);
  }

  ionViewDidLeave() {}
  ionViewDidLoad() {
    console.log("ionViewDidLoad SelectedPage");
  }

  // logButtonPress(state: boolean) {
  //   console.log("button " + state);
  // }
}
