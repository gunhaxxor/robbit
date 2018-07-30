import { Component } from "@angular/core";

//import { DeviceListPage } from "../deviceList/deviceList";
import { HomePage } from "../home/home";
import { BlePage } from "../bledevices/bledevices";
import { RobotControlPage } from "../robotControl/robotControl";
@Component({
  templateUrl: "tabs.html"
})
export class TabsPage {
  tab1Root = HomePage;
  tab2Root = BlePage;
  tab3Root = RobotControlPage;
  constructor() {}
}
