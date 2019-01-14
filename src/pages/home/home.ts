import { Component, ApplicationRef } from "@angular/core";
import { NavController } from "ionic-angular";
import { Platform } from 'ionic-angular/platform/platform';
import { BleService } from "../../providers/bleservice/bleService";
import { DriverInterfacePage } from "../driverInterface/driverInterface";
import { RobotInterfacePage } from "../robotInterface/robotInterface";
import { Storage } from '@ionic/storage';
import { Device } from '@ionic-native/device';

import * as firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/auth';
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
  nameAlreadyTaken: string = undefined;

  constructor(private navCtrl: NavController, private appRef: ApplicationRef, private bleService: BleService, private plt: Platform, private storage: Storage, private device: Device) {
    console.log(`signaling server: ${process.env.SIGNALING_SERVER}`);
    let config: Object = JSON.parse(process.env.FIREBASE_CONFIG);
    
    firebase.initializeApp(config);
    
    firebase.auth().signInAnonymously()
    .then(() => {
      console.log("anonymously logged into firebase");
    })
    .catch(function(error) {
      console.log(error);
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      // ...
    });

    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        // User is signed in.
        console.log(user);
        // var isAnonymous = user.isAnonymous;
        let uid = user.uid;
        this.storage.set('firebaseUid', uid);
      } else {
        // User is signed out.
        console.log("user signed out of firebase");
      }
    });

  }

  ionViewDidLoad() {
    console.log("this.plt.is('cordova'):  " + this.plt.is('cordova'));
    if(this.plt.is('cordova')){
      this.storage.ready().then(() =>{
        this.storage.get('robotName').then((name)=>{
          if(name === null){
            console.log("key not found in storage: robotName");
          }else{
            console.log(`got robot name from storage: ${name}`);
            this.storedName = name;
            this.robotName = name;
          }
        }).catch((err) => {
          console.log(err);
        });
      })
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

  saveNameAndGoToRobotInterface(){
    this.robotName = this.robotName.trim();

    firebase.database().ref('robot-names/' + this.robotName)
    .transaction((currentData) => {
      if (currentData === null) {
        return this.device.uuid;
      } else {
        console.log('robot name already exists.');
        return; // Abort the transaction.
      }
    })
    .then(({committed, snapshot}) => {
      if(!committed){
        console.log('We aborted the transaction (because robot name already exists).');
        this.nameAlreadyTaken = this.robotName;
        // this.appRef.tick();
      }else{
        console.log('robot name added to firebase!');
        this.nameAlreadyTaken = undefined;
        this.storage.set('robotName', this.robotName).then(() => {
          this.navCtrl.push(RobotInterfacePage, {robotName: this.robotName} );
        });
      }
    })
    .catch((err) => {
      console.log('Transaction failed abnormally!', err);
    });
    // function(error, committed, snapshot) {
    //   if (error) {
    //     console.log('Transaction failed abnormally!', error);
    //   } else if (!committed) {
    //     console.log('We aborted the transaction (because ada already exists).');
    //   } else {
    //     console.log('User ada added!');
    //   }
    //   console.log("Ada's data: ", snapshot.val());
    // });



    // firebase.database().ref('robot-names/' + name).set(this.device.uuid)
    // .then(() => {
    //   this.storage.set('robotName', name).then(() => {
    //     this.navCtrl.push(RobotInterfacePage, {robotName: this.robotName} );
    //   });
    // })
    // .catch((err) => {
    //   console.log(err);

    // })
  }

  goToDriverInterface() {
    this.navCtrl.push(DriverInterfacePage, {robotName: this.robotName} );
  }
  goToRobotInterface() {
    this.navCtrl.push(RobotInterfacePage, {robotName: this.robotName} );
  }
}
