import { Component, OnInit, Input } from '@angular/core';
import { BleService } from "../../providers/bleservice/bleService";


@Component({
    selector: 'app-ble-status',
    templateUrl: './ble-status.component.html',
    styleUrls: ['./ble-status.component.scss']
})
export class BleStatusComponent implements OnInit {
    @Input() bleService: BleService;

    statusColor : String = "red";
   
    constructor() { }
   
    ngOnInit() {
    }
   
  }