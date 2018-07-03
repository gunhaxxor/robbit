import { NgModule, ErrorHandler } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { IonicApp, IonicModule, IonicErrorHandler } from "ionic-angular";
import { MyApp } from "./app.component";

import { DeviceListPage } from "../pages/deviceList/deviceList";
import { HomePage } from "../pages/home/home";
import { TabsPage } from "../pages/tabs/tabs";
import { RobotControlPage } from "../pages/robotControl/robotControl";
import { VideolinkPage } from "../pages/videolink/videolink";
import { PeerPage } from "../pages/peer/peer";

import { StatusBar } from "@ionic-native/status-bar";
import { SplashScreen } from "@ionic-native/splash-screen";
import { BLE } from "@ionic-native/ble";
import { LoadingController } from "ionic-angular";
import { BleService } from "../providers/bleservice/BleService";
import { HttpModule } from "@angular/http";
import { AndroidPermissions } from "@ionic-native/android-permissions";
import { Camera } from "@ionic-native/camera";
import { Diagnostic } from "@ionic-native/diagnostic";

@NgModule({
  declarations: [
    MyApp,
    DeviceListPage,
    HomePage,
    TabsPage,
    RobotControlPage,
    VideolinkPage,
    PeerPage
  ],
  imports: [BrowserModule, IonicModule.forRoot(MyApp), HttpModule],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    DeviceListPage,
    HomePage,
    TabsPage,
    RobotControlPage,
    VideolinkPage,
    PeerPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    BLE,
    BleService,
    LoadingController,
    AndroidPermissions,
    Camera,
    Diagnostic,
    { provide: ErrorHandler, useClass: IonicErrorHandler }
  ]
})
export class AppModule {}
