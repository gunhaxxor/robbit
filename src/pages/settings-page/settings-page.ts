import { Component } from "@angular/core";
import { ViewController  } from "ionic-angular";

// @IonicPage()
@Component({
  selector: "page-settings",
  templateUrl: "settings-page.html"
})
export class SettingsPage {
  
  constructor(
    public viewCtrl: ViewController
  ) {
    
  }

  ionViewDidLeave() {
  }

  ionViewWillLeave(){
  }

  ionViewDidEnter() {

  }
}
