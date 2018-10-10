import { NgModule, ErrorHandler } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { IonicApp, IonicModule, IonicErrorHandler } from "ionic-angular";
import { MyApp } from "./app.component";

import { DeviceListPage } from "../pages/deviceList/deviceList";
import { HomePage } from "../pages/home/home";
import { DriverInterfacePage } from "../pages/driverInterface/driverInterface";
import { RobotInterfacePage } from "../pages/robotInterface/robotInterface";
import { BlePage } from "../pages/bledevices/bledevices";

import { StatusBar } from "@ionic-native/status-bar";
import { SplashScreen } from "@ionic-native/splash-screen";
import { BLE } from "@ionic-native/ble";
import { LoadingController } from "ionic-angular";
import { BleService } from "../providers/bleservice/bleService";
import { HttpModule } from "@angular/http";
import { SocketIoModule, SocketIoConfig } from "ng-socket-io";
import { Camera } from "@ionic-native/camera";
import { Diagnostic } from "@ionic-native/diagnostic"

const socketConfig: SocketIoConfig = {
  url: "https://social-robot-signaling-server.herokuapp.com/",
  options: {}
};

@NgModule({
  declarations: [
    MyApp,
    DeviceListPage,
    HomePage,
    DriverInterfacePage,
    RobotInterfacePage,
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
    DriverInterfacePage,
    RobotInterfacePage,
    BlePage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    BLE,
    BleService,
    LoadingController,
    Camera,
    Diagnostic,
    { provide: ErrorHandler, useClass: IonicErrorHandler }
  ]
})
export class AppModule {}
