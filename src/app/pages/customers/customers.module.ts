import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomersRoutingModule } from './customers-routing.module';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { DataTablesModule } from 'angular-datatables';
import { NgSelectModule } from '@ng-select/ng-select';
import { CustomersListComponent } from './customers-list/customers-list.component';
import { CustomerAddComponent } from './customer-add/customer-add.component';
import { CustomerEditComponent } from './customer-edit/customer-edit.component';
import { CustomerShowComponent } from './customer-show/customer-show.component';


@NgModule({
  declarations: [
    CustomersListComponent,
    CustomerAddComponent,
    CustomerEditComponent,
    CustomerShowComponent
  ],
  imports: [
    CommonModule,
    CustomersRoutingModule,
    SidebarComponent,
    FormsModule,
    DataTablesModule,
    NgSelectModule
  ]
})
export class CustomersModule { }
