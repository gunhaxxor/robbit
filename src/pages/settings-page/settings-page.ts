import { Component } from "@angular/core";
import { ViewController, NavParams  } from "ionic-angular";

// @IonicPage()
@Component({
  selector: "page-settings",
  templateUrl: "settings-page.html"
})
export class SettingsPage {
  driverPage: any;
  voiceControlEnabled: boolean;

  constructor(
    public viewCtrl: ViewController,
    public params: NavParams
  ) {
    
  }

  ionViewDidLoad() {
  }
  
  ionViewDidLeave() {
  }
  
  ionViewWillLeave(){
  }
  
  ionViewWillEnter() {
  }
  
  ionViewDidEnter() {
    this.driverPage = this.params.get('driverPage')();
    this.voiceControlEnabled = this.driverPage.voiceControlEnabled;
  }

  setVoiceControl() {
    this.driverPage.voiceControlEnabled = this.voiceControlEnabled;
    this.driverPage.setVoiceControl();
  }
}
