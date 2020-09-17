import { Component } from '@angular/core';
import { BleService } from "../../providers/bleservice/bleService";

@Component({
  selector: 'ble-button',
  templateUrl: 'ble-button.html'
})
export class BleButtonComponent {

  constructor(public bleService: BleService) {
    console.log('Hello BleButtonComponent Component');
    console.log("this.bleService");
    console.log(this.bleService);
  }

}
