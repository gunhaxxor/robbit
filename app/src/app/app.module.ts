import { NgModule, ErrorHandler } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { IonicApp, IonicModule, IonicErrorHandler } from "ionic-angular";
import { MyApp } from "./app.component";

// import { DeviceListPage } from "../pages/deviceList/deviceList";
import { HomePage } from "../pages/home/home";
import { DriverInterfacePage } from "../pages/driverInterface/driverInterface";
import { RobotInterfacePage } from "../pages/robotInterface/robotInterface";
import { BlePage } from "../pages/bledevices/bledevices";
import { EmojiPage } from "../pages/emoji-page/emoji-page";
import { SettingsPage } from "../pages/settings-page/settings-page";

import { BleButtonComponent } from "../components/ble-button/ble-button";

import { AppVersion } from "@ionic-native/app-version";
import { StatusBar } from "@ionic-native/status-bar";
import { SplashScreen } from "@ionic-native/splash-screen";
import { BLE } from "@ionic-native/ble";
import { LoadingController } from "ionic-angular";
import { BleService } from "../providers/bleservice/bleService";
import { HttpModule } from "@angular/http";
import { SocketIoModule, SocketIoConfig } from "ng-socket-io";
import { Camera } from "@ionic-native/camera";
import { Diagnostic } from "@ionic-native/diagnostic";
import { LocationAccuracy } from "@ionic-native/location-accuracy";
import { Network } from "@ionic-native/network";
import { NativeAudio } from "@ionic-native/native-audio";
import { Device } from "@ionic-native/device";
import { IonicStorageModule } from "@ionic/storage";
import { ScreenOrientation } from "@ionic-native/screen-orientation";

// console.log(`signaling server within app module: ${process.env.SIGNALING_SERVER}`);

const socketConfig: SocketIoConfig = {
  url: process.env.SIGNALING_SERVER,
  options: {}
};

@NgModule({
  declarations: [
    MyApp,
    // DeviceListPage,
    HomePage,
    DriverInterfacePage,
    RobotInterfacePage,
    BlePage,
    BleButtonComponent,
    EmojiPage,
    SettingsPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    HttpModule,
    SocketIoModule.forRoot(socketConfig),
    IonicStorageModule.forRoot()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    HomePage,
    DriverInterfacePage,
    RobotInterfacePage,
    EmojiPage,
    SettingsPage
  ],
  providers: [
    AppVersion,
    StatusBar,
    SplashScreen,
    BLE,
    BleService,
    LoadingController,
    Camera,
    Diagnostic,
    LocationAccuracy,
    Network,
    NativeAudio,
    Device,
    ScreenOrientation,
    { provide: ErrorHandler, useClass: IonicErrorHandler }
  ]
})
export class AppModule { }
