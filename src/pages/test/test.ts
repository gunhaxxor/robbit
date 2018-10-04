import { Component } from "@angular/core";
import { IonicPage, NavController, NavParams, Platform } from "ionic-angular";
import { LoadingController } from "ionic-angular";

@IonicPage()
@Component({
  selector: "page-test",
  templateUrl: "test.html"
})
export class testPage {
  constructor(
    public platform: Platform,
    public navCtrl: NavController,
    public loading: LoadingController,
    public navParams: NavParams
  ) {}

  ionViewDidLoad() {}
}
