import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SelectedPage } from './selected';

@NgModule({
  declarations: [
    SelectedPage,
  ],
  imports: [
    IonicPageModule.forChild(SelectedPage),
  ],
})
export class SelectedPageModule {}
