import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomersRoutingModule } from './customers-routing.module';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { DataTablesModule } from 'angular-datatables';

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    CustomersRoutingModule,
    SidebarComponent,
    FormsModule,
    DataTablesModule
  ]
})
export class CustomersModule { }
