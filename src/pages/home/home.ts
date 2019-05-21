import { Component, ApplicationRef } from "@angular/core";
import { NavController } from "ionic-angular";
import { Platform } from 'ionic-angular/platform/platform';
import { DriverInterfacePage } from "../driverInterface/driverInterface";
import { RobotInterfacePage } from "../robotInterface/robotInterface";
import { Storage } from '@ionic/storage';
import { Device } from '@ionic-native/device';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { Network } from '@ionic-native/network';
import { Diagnostic } from "@ionic-native/diagnostic";


import * as firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/auth';
import { isRightSide } from "ionic-angular/umd/util/util";
// declare let cordova: any;

@Component({
  selector: "page-home",
  templateUrl: "home.html"
})
export class HomePage {
  recentConnectedRobots: object = {};
  robotName: string;
  storedName: string = undefined;
  invalidRobotName: string = undefined;
  objectKeys: any = Object.keys; ///Weird hack to call this function from template:-P
  locationEnabled: boolean = false;
  wifiCheckInterval: number = null;
  wifiEnabled: boolean = true;
  internetAvailable: boolean = true;
  signedIn: boolean = false;

  constructor(private navCtrl: NavController, private diagnostic: Diagnostic, private network: Network, private plt: Platform, private storage: Storage, private device: Device, private screenOrientation: ScreenOrientation) {
    console.log(`signaling server: ${process.env.SIGNALING_SERVER}`);
    let config: Object = JSON.parse(process.env.FIREBASE_CONFIG);

    firebase.initializeApp(config);

    this.signInToFirebase();

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

  ionViewWillEnter() {
    if (this.plt.is('cordova')) {
      this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT);
    }
  }

  ionViewWillLeave() {
    if (this.wifiCheckInterval) {
      clearInterval(this.wifiCheckInterval);
    }
  }

  checkWifiAvailable() {
    this.diagnostic.isWifiAvailable().then((available: any) => {
      // console.log("WiFi is " + (available ? "available" : "not available"));
      this.wifiEnabled = available;
    }).catch((error: any) => {
      console.error("Error while checking wifi: " + error);
    });
  }

  attachInternetConnectionListeners() {
    // watch network for a connection
    this.network.onConnect().subscribe(() => {
      this.internetAvailable = true;
      if (!this.signedIn) {
        this.signInToFirebase();
      }
      console.log('network connected! This means internet!!!!!');
      // We just got a connection but we need to wait briefly
      // before we determine the connection type. Might need to wait.
      // prior to doing any api requests as well.
      setTimeout(() => {
        if (this.network.type === this.network.Connection.WIFI) {
          console.log('we got a wifi connection, woohoo!');
        }
      }, 3000);
    });

    this.network.onDisconnect().subscribe(() => {
      this.internetAvailable = false;
      console.log('network disconnected!');
    });
  }

  checkLocationEnabled() {
    this.diagnostic.isLocationEnabled().then((enabled: any) => {
      console.log("Location is " + (enabled ? "enabled" : "not enabled"));
      this.locationEnabled = enabled;
    }).catch((error: any) => {
      console.error("Error while checking location: " + error);
    });
  }

  signInToFirebase() {
    let signInPromise: Promise<any> = firebase.auth().signInAnonymously()
      .then((credentials) => {
        console.log("anonymously logged into firebase");
        // console.log(credentials);
        this.signedIn = true;
      })
      .catch((error) => {
        console.log(error);
        // Handle Errors here.
        // var errorCode = error.code;
        // var errorMessage = error.message;
        // ...
      });
  }

  ionViewDidLoad() {
    console.log("this.plt.is('cordova'):  " + this.plt.is('cordova'));
    if (this.plt.is('cordova')) {
      this.storage.ready().then(() => {
        this.storage.get('robotName').then((name) => {
          if (name === null) {
            console.log("key not found in storage: robotName");
          } else {
            console.log(`got robot name from storage: ${name}`);
            this.storedName = name;
            this.robotName = name;
          }
        }).catch((err) => {
          console.log(err);
        });
      })
      this.wifiCheckInterval = setInterval(() => {
        this.checkWifiAvailable();
        this.checkLocationEnabled();
      }, 1000);
      this.attachInternetConnectionListeners();
    } else {
      this.storage.ready().then(() => {
        this.storage.get('recent-connected-robots').then((robots) => {
          if (robots === null) {
            console.log("key not found in storage: recent-connected-robots");
          } else {
            let parsedRobots = JSON.parse(robots)
            console.log(`got robot list from storage:`);
            console.log(robots);
            this.recentConnectedRobots = parsedRobots;
          }
        }).catch((err) => {
          console.log(err);
        });
      })
    }
  }

  saveNameAndGoToRobotInterface() {
    this.robotName = this.robotName.trim().toLowerCase();

    firebase.database().ref('robot-names/' + this.robotName)
      .transaction((currentData) => {
        if (currentData === null) {
          return this.device.uuid;
        } else {
          console.log('robot name already exists.');
          return; // Abort the transaction.
        }
      })
      .then(({ committed, snapshot }) => {
        if (!committed) {
          console.log('We aborted the transaction (because robot name already exists).');
          this.invalidRobotName = this.robotName;
          // this.appRef.tick();
        } else {
          console.log('robot name added to firebase!');
          this.invalidRobotName = undefined;
          this.storage.set('robotName', this.robotName).then(() => {
            this.navCtrl.push(RobotInterfacePage, { robotName: this.robotName });
          });
        }
      })
      .catch((err) => {
        console.log('Transaction failed abnormally!', err);
      });
  }

  checkNameAndGoToDriverInterface() {
    this.robotName = this.robotName.trim().toLowerCase();

    firebase.database().ref('robot-names/' + this.robotName).once('value').then((snapshot) => {
      if (!snapshot.val()) {
        console.log("No such robot found");
        this.invalidRobotName = this.robotName;
        return;
      }
      this.invalidRobotName = undefined;
      this.recentConnectedRobots[this.robotName] = Date.now();
      this.storage.set('recent-connected-robots', JSON.stringify(this.recentConnectedRobots)).then(() => {
        this.navCtrl.push(DriverInterfacePage, { robotName: this.robotName });
      });
    });
  }

  goToDriverInterface() {
    this.navCtrl.push(DriverInterfacePage, { robotName: this.robotName });
  }
  goToRobotInterface() {
    this.navCtrl.push(RobotInterfacePage, { robotName: this.robotName });
  }

  robotsByDate(a, b) {
    return a.value > b.value ? -1 : 1;
  }
}
