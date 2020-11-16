import { AppVersion } from "@ionic-native/app-version";
import { Component } from "@angular/core";
import { Platform } from "ionic-angular";
import { SplashScreen } from "@ionic-native/splash-screen";
import { BLE } from "@ionic-native/ble";
// import { BleService } from "../providers/bleservice/bleService";
import { Diagnostic } from "@ionic-native/diagnostic";
import { HomePage } from "../pages/home/home";


@Component({
  templateUrl: "app.html"
})
export class MyApp {
  rootPage: any = HomePage;

  constructor(
    platform: Platform,
    private appVersion: AppVersion,
    splashScreen: SplashScreen,
    public ble: BLE,
    // private bleService: BleService,
    private diagnostic: Diagnostic
  ) {
    platform.ready().then(() => {
      if (platform.is('cordova')) {
        this.appVersion.getVersionNumber().then(
          (versionNumber) => {
            console.log("app version: v" + versionNumber);
          },
          (err) => console.error(err)
        )
        this.diagnostic.requestRuntimePermissions([this.diagnostic.permission.CAMERA,
        this.diagnostic.permission.RECORD_AUDIO
          // ,this.diagnostic.permission.ACCESS_COARSE_LOCATION
        ])
          .then(() => {
            console.log("runtime permission requests were approved");
          })
          .catch((err) => console.log("permissions request rejected: " + err));

        // Okay, so the platform is ready and our plugins are available.
        // Here you can do any higher level native things you might need.

        // statusBar.styleDefault();
        splashScreen.hide();
      }
    });
  }
}
