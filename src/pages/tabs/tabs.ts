import { Component } from "@angular/core";

//import { DeviceListPage } from "../deviceList/deviceList";
import { HomePage } from "../home/home";
import { VideolinkPage } from "../videolink/videolink";
import { PeerPage } from "../peer/peer";
import { BlePage } from "../bledevices/bledevices";
import { RobotControlPage } from "../robotControl/robotControl";
@Component({
  templateUrl: "tabs.html"
})
export class TabsPage {
  tab1Root = HomePage;
  tab2Root = VideolinkPage;
  tab3Root = PeerPage;
  tab4Root = BlePage;
  tab5Root = RobotControlPage;
  constructor() {}
}
