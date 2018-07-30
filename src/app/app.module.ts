import { NgModule, ErrorHandler } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { IonicApp, IonicModule, IonicErrorHandler } from "ionic-angular";
import { MyApp } from "./app.component";

import { DeviceListPage } from "../pages/deviceList/deviceList";
import { HomePage } from "../pages/home/home";
import { TabsPage } from "../pages/tabs/tabs";
import { RobotControlPage } from "../pages/robotControl/robotControl";
import { VideolinkPage } from "../pages/videolink/videolink";
import { BlePage } from "../pages/bledevices/bledevices";

import { StatusBar } from "@ionic-native/status-bar";
import { SplashScreen } from "@ionic-native/splash-screen";
import { BLE } from "@ionic-native/ble";
import { LoadingController } from "ionic-angular";
import { BleService } from "../providers/bleservice/BleService";
import { HttpModule } from "@angular/http";
import { AndroidPermissions } from "@ionic-native/android-permissions";
import { SocketIoModule, SocketIoConfig } from "ng-socket-io";

const socketConfig: SocketIoConfig = {
  url: "https://social-robot-signaling-server.herokuapp.com/",
  options: {}
};

@NgModule({
  declarations: [
    MyApp,
    DeviceListPage,
    HomePage,
    TabsPage,
    RobotControlPage,
    VideolinkPage,
    BlePage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    HttpModule,
    SocketIoModule.forRoot(socketConfig)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    DeviceListPage,
    HomePage,
    TabsPage,
    RobotControlPage,
    VideolinkPage,
    BlePage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    BLE,
    BleService,
    LoadingController,
    AndroidPermissions,
    { provide: ErrorHandler, useClass: IonicErrorHandler }
  ]
})
export class AppModule {}
