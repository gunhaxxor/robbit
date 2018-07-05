import { Component } from "@angular/core";

//import { DeviceListPage } from "../deviceList/deviceList";
import { HomePage } from "../home/home";
import { VideolinkPage } from "../videolink/videolink";
import { PeerPage } from "../peer/peer";
import { BlePage } from "../bledevices/bledevices";
@Component({
  templateUrl: "tabs.html"
})
export class TabsPage {
  tab1Root = HomePage;
  tab2Root = VideolinkPage;
  tab3Root = PeerPage;
  tab4Root = BlePage;
  constructor() {}
}
