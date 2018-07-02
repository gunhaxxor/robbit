import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { VideolinkPage } from './videolink';

@NgModule({
  declarations: [
    VideolinkPage,
  ],
  imports: [
    IonicPageModule.forChild(VideolinkPage),
  ],
})
export class VideolinkPageModule {}
