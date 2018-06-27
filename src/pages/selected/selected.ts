import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { LoadingController } from 'ionic-angular';
import { BLE } from '@ionic-native/ble';

@IonicPage()
@Component({
  selector: 'page-selected',
  templateUrl: 'selected.html',
})
export class SelectedPage {
  setStatus: any;
  peripheral: any;
  connecteddd: boolean = false;
  constructor(public navCtrl: NavController, private ble: BLE, public loading: LoadingController, public navParams: NavParams) {
    let device = navParams.get('device');
    this.setStatus = ("Shaking hand with " + device.name + " ID: " + device.id);
    // UUID ex. FF11 = 1 on && 0 off


    this.ble.connect(device.id).subscribe(
      peripheral => this.onConnected(peripheral),
      peripheral => this.onDeviceDisconnected(peripheral)
    );
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
    this.peripheral = peripheral; // Peripheral is the slave && central master  
    this.connecteddd = true;
    console.log(JSON.stringify(peripheral));
  }

  onDeviceDisconnected(peripheral) {
    this.peripheral = undefined;
    alert("Handshake stopped");
    this.connecteddd = false;
  }

  // When user is leaving the selected page. 
  ionViewWillLeave() {
    this.ble.disconnect(this.peripheral.id);
  }

  ionViewDidLeave() {
    this.peripheral = 0;
  }

  ionViewDidLoad() {
    this.presentloading();
    console.log('ionViewDidLoad SelectedPage');
  }

  sender() {
    let msg = 1.;
    let buffer = new Uint8Array([msg]).buffer;
    this.ble.write(this.peripheral.id, this.peripheral.services[4], , buffer);
  }

}

