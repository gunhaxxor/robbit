import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import "webrtc-adapter";

import { AppModule } from "./app.module";

platformBrowserDynamic().bootstrapModule(AppModule);
