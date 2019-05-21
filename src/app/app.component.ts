import { Component } from "@angular/core";
import { Platform } from "ionic-angular";
import { StatusBar } from "@ionic-native/status-bar";
import { SplashScreen } from "@ionic-native/splash-screen";
import { BLE } from "@ionic-native/ble";
import { BleService } from "../providers/bleservice/bleService";
import { Diagnostic } from "@ionic-native/diagnostic";
import { HomePage } from "../pages/home/home";

@Component({
  templateUrl: "app.html"
})
export class MyApp {
  rootPage: any = HomePage;

  constructor(
    platform: Platform,
    statusBar: StatusBar,
    splashScreen: SplashScreen,
    public ble: BLE,
    private bleService: BleService,
    private diagnostic: Diagnostic
  ) {
    platform.ready().then(() => {
      this.diagnostic.requestRuntimePermissions([this.diagnostic.permission.CAMERA, this.diagnostic.permission.RECORD_AUDIO])
        .then(() => {
          console.log("runtime permission requests were approved");
        })
        .catch((err) => console.log("permissions request rejected: " + err));

      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.

      // statusBar.styleDefault();
      console.log('Hiding the status bar');
      statusBar.hide();
      splashScreen.hide();
    });
  }
}
