import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../../auth.guard';
import {
  PurchaseOrderListGuard,
  PurchaseOrderViewGuard,
  PurchaseOrderCreateGuard,
  PurchaseOrderEditGuard,
  PurchaseOrderReceiveGuard
} from './guards/purchase-order-permission.guards';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    loadComponent: () => import('./purchase-order-list/purchase-order-list.component')
      .then(m => m.PurchaseOrderListComponent),
    canActivate: [AuthGuard, PurchaseOrderListGuard],
    data: { title: 'Órdenes de Compra' }
  },
  {
    path: 'add',
    loadComponent: () => import('./purchase-order-add/purchase-order-add.component')
      .then(m => m.PurchaseOrderAddComponent),
    canActivate: [AuthGuard, PurchaseOrderCreateGuard],
    data: { title: 'Nueva Orden de Compra' }
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./purchase-order-edit/purchase-order-edit.component')
      .then(m => m.PurchaseOrderEditComponent),
    canActivate: [AuthGuard, PurchaseOrderEditGuard],
    data: { title: 'Editar Orden de Compra' }
  },
  {
    path: 'show/:id',
    loadComponent: () => import('./purchase-order-show/purchase-order-show.component')
      .then(m => m.PurchaseOrderShowComponent),
    canActivate: [AuthGuard, PurchaseOrderViewGuard],
    data: { title: 'Detalle de Orden de Compra' }
  },
  {
    path: 'receive/:id',
    loadComponent: () => import('./purchase-order-receive/purchase-order-receive.component')
      .then(m => m.PurchaseOrderReceiveComponent),
    canActivate: [AuthGuard, PurchaseOrderReceiveGuard],
    data: { title: 'Recibir Mercancía' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PurchaseOrdersRoutingModule { }
