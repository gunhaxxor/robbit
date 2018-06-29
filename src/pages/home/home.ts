import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ServicesProvider } from "../../providers/services/services";

@Component({
  selector: "page-home",
  templateUrl: "home.html",
  providers: [ServicesProvider]
})
export class HomePage {
  constructor(public navCtrl: NavController, public serice: ServicesProvider) {}
}
