import { Component } from "@angular/core";

//import { DeviceListPage } from "../deviceList/deviceList";
import { HomePage } from "../home/home";
import { VideolinkPage } from "../videolink/videolink";
@Component({
  templateUrl: "tabs.html"
})
export class TabsPage {
  tab1Root = HomePage;
  tab2Root = VideolinkPage;

  constructor() {}
}
