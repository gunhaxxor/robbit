import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { Platform } from 'ionic-angular/platform/platform';
import { BleService } from "../../providers/bleservice/bleService";
import { DriverInterfacePage } from "../driverInterface/driverInterface";
import { RobotInterfacePage } from "../robotInterface/robotInterface";
import { Storage } from '@ionic/storage';

import * as firebase from 'firebase/app';
import 'firebase/database';
// declare let cordova: any;

// <script src="https://www.gstatic.com/firebasejs/5.7.2/firebase.js"></script>
// <script>
//   // Initialize Firebase
//   var config = 
//   firebase.initializeApp(config);
// </script>

@Component({
  selector: "page-home",
  templateUrl: "home.html"
})
export class HomePage {
  robotName: string;
  storedName: string = undefined;

  constructor(public navCtrl: NavController, public bleService: BleService, private plt: Platform, private storage: Storage) {

  }

  ionViewDidLoad() {
    let config = process.env.FIREBASE_CONFIG;
    firebase.initializeApp(config);
    console.log("this.plt.is('cordova')");
    console.log(this.plt.is('cordova'));
    if(this.plt.is('cordova')){
      this.storage.get('robotName').then((name)=>{
        this.storedName = name;
        this.robotName = name;
      }).catch((err) => {
        console.log("no key found in storage: robotName");
        console.log(err);
      });
    }
  }

  // changed() {
  //   if (!this.toggleValue) {
  //     console.log("Control mode on");
  //     this.bleService.sharedState.isConnectedToDevice = true;
  //   } else {
  //     console.log("Buetooth mode on");
  //     this.bleService.sharedState.isConnectedToDevice = false;
  //   }
  // }

  saveNameAndGoToDriverInterface(){
    this.storage.set('robotName', this.robotName.trim()).then(() => {
      this.navCtrl.push(DriverInterfacePage, {robotName: this.robotName} );
    })
  }

  goToDriverInterface() {
    this.navCtrl.push(DriverInterfacePage, {robotName: this.robotName} );
  }
  goToRobotInterface() {
    this.navCtrl.push(RobotInterfacePage, {robotName: this.robotName} );
  }
}
