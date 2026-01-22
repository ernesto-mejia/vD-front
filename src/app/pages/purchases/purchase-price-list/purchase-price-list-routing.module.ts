import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../../auth.guard';
import { PurchasePriceListListComponent } from './purchase-price-list-list/purchase-price-list-list.component';
import { PurchasePriceListAddComponent } from './purchase-price-list-add/purchase-price-list-add.component';
import { PurchasePriceListShowComponent } from './purchase-price-list-show/purchase-price-list-show.component';
import { PurchasePriceListEditComponent } from './purchase-price-list-edit/purchase-price-list-edit.component';
import {
  PurchasePriceListListGuard,
  PurchasePriceListViewGuard,
  PurchasePriceListCreateGuard,
  PurchasePriceListEditGuard
} from './guards/purchase-price-list-permission.guards';


const routes: Routes = [
  // Lista de precios list
  {
    path: 'list',
    component: PurchasePriceListListComponent,
    canActivate: [AuthGuard, PurchasePriceListListGuard],
  },
  // Lista de precios add
  {
    path: 'add',
    component: PurchasePriceListAddComponent,
    canActivate: [AuthGuard, PurchasePriceListCreateGuard],
  },
  // Lista de precios show
  {
    path: 'show/:id',
    component: PurchasePriceListShowComponent,
    canActivate: [AuthGuard, PurchasePriceListViewGuard],
  },
  // Lista de precios edit
  {
    path: 'edit/:id',
    component: PurchasePriceListEditComponent,
    canActivate: [AuthGuard, PurchasePriceListEditGuard],
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PurchasePriceListRoutingModule { }
