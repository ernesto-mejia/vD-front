import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PurchasePriceListRoutingModule } from './purchase-price-list-routing.module';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { DataTablesModule } from 'angular-datatables';
import { NgSelectModule } from '@ng-select/ng-select';
import { PurchasePriceListListComponent } from './purchase-price-list-list/purchase-price-list-list.component';
import { PurchasePriceListAddComponent } from './purchase-price-list-add/purchase-price-list-add.component';
import { PurchasePriceListEditComponent } from './purchase-price-list-edit/purchase-price-list-edit.component';
import { PurchasePriceListShowComponent } from './purchase-price-list-show/purchase-price-list-show.component';


@NgModule({
  declarations: [
    PurchasePriceListListComponent,
    PurchasePriceListAddComponent,
    PurchasePriceListEditComponent,
    PurchasePriceListShowComponent
  ],
  imports: [
    CommonModule,
    PurchasePriceListRoutingModule,
    SidebarComponent,
    FormsModule,
    DataTablesModule,
    NgSelectModule
  ]
})
export class PurchasePriceListModule { }
