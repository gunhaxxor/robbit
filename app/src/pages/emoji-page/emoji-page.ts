import { Component } from "@angular/core";
import { ViewController  } from "ionic-angular";

// @IonicPage()
@Component({
  selector: "page-emoji",
  templateUrl: "emoji-page.html"
})
export class EmojiPage {
  
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

  setEmoji(text:String) {
    this.viewCtrl.dismiss(text);
  }
}
