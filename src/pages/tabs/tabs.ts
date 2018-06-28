import { Component } from "@angular/core";

import { DeviceListPage } from "../deviceList/deviceList";
import { HomePage } from "../home/home";

@Component({
  templateUrl: "tabs.html"
})
export class TabsPage {
  tab1Root = HomePage;
  tab2Root = DeviceListPage;

  constructor() {}
}
