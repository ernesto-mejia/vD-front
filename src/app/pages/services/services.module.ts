import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ServicesRoutingModule } from './services-routing.module';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { DataTablesModule } from 'angular-datatables';
import { NgSelectModule } from '@ng-select/ng-select';
import { ServicesListComponent } from './services-list/services-list.component';
import { ServiceAddComponent } from './service-add/service-add.component';
import { ServiceEditComponent } from './service-edit/service-edit.component';
import { ServiceShowComponent } from './service-show/service-show.component';


@NgModule({
  declarations: [
    ServicesListComponent,
    ServiceAddComponent,
    ServiceEditComponent,
    ServiceShowComponent
  ],
  imports: [
    CommonModule,
    ServicesRoutingModule,
    SidebarComponent,
    FormsModule,
    DataTablesModule,
    NgSelectModule
  ]
})
export class ServicesModule { }
