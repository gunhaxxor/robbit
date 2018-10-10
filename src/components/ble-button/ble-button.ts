import { Component } from '@angular/core';

/**
 * Generated class for the BleButtonComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'ble-button',
  templateUrl: 'ble-button.html',
  styleUrls: ['./ble-button.component.scss']
})
export class BleButtonComponent {

  text: string;

  constructor() {
    console.log('Hello BleButtonComponent Component');
    this.text = 'Hello World';
  }

}
