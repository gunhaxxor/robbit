import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { BleService } from "../../providers/bleservice/BleService";

@Component({
  selector: "page-home",
  templateUrl: "home.html"
})
export class HomePage {
  constructor(public navCtrl: NavController, public bleService: BleService) {}
}
