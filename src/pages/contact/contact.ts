import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { BLE } from '@ionic-native/ble';
import { LoadingController } from 'ionic-angular';
import { SelectedPage } from '../selected/selected';

@Component({
  selector: 'page-contact',
  templateUrl: 'contact.html'
})
export class ContactPage {
  devices: any[] = [];
  statusMessage: string;
  setStatus: any;
  scanError: any;
  constructor(public navCtrl: NavController, private ble: BLE, public loading: LoadingController) {

  }
  // Loader, basically updates the list when scanning is running
  presentloading() {
    const loader = this.loading.create({
      content: "Söker efter apparater",
      duration: 3000
    });
    loader.present();
  }
  // Scan function for Bluetooth / BLE
  scan() {
    this.setStatus = ('Skannar efter bluetooth apparater');
    this.devices = [];
    this.ble.scan([], 7).subscribe(
      device => this.DevFound(device)
    );
    this.presentloading();
  }
  // When a device is discovered
  DevFound(device) {
    this.devices.push(device);
  }
  // When user selects a device from the array / list
  selecteddevice(device) {
    this.navCtrl.push(SelectedPage, {
      device: device
    });
  }
}
