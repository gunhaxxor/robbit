import { NgModule, ErrorHandler } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { IonicApp, IonicModule, IonicErrorHandler } from "ionic-angular";
import { MyApp } from "./app.component";

import { DeviceListPage } from "../pages/deviceList/deviceList";
import { HomePage } from "../pages/home/home";
import { TabsPage } from "../pages/tabs/tabs";
import { RobotControlPage } from "../pages/robotControl/robotControl";

import { StatusBar } from "@ionic-native/status-bar";
import { SplashScreen } from "@ionic-native/splash-screen";
import { BLE } from "@ionic-native/ble";
import { LoadingController } from "ionic-angular";

@NgModule({
  declarations: [MyApp, DeviceListPage, HomePage, TabsPage, RobotControlPage],
  imports: [BrowserModule, IonicModule.forRoot(MyApp)],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    DeviceListPage,
    HomePage,
    TabsPage,
    RobotControlPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    BLE,
    LoadingController,
    { provide: ErrorHandler, useClass: IonicErrorHandler }
  ]
})
export class AppModule {}
