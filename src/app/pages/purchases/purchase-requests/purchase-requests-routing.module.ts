import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../../auth.guard';
import {
  PurchaseRequestListGuard,
  PurchaseRequestViewGuard,
  PurchaseRequestCreateGuard,
  PurchaseRequestEditGuard,
  PurchaseRequestPreauthorizeGuard,
  MyAuthorizationsGuard,
  PurchaseTrackingGuard
} from './guards/purchase-request-permission.guards';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    loadComponent: () => import('./purchase-request-list/purchase-request-list.component').then(m => m.PurchaseRequestListComponent),
    canActivate: [AuthGuard, PurchaseRequestListGuard]
  },
  {
    path: 'add',
    loadComponent: () => import('./purchase-request-add/purchase-request-add.component').then(m => m.PurchaseRequestAddComponent),
    canActivate: [AuthGuard, PurchaseRequestCreateGuard]
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./purchase-request-edit/purchase-request-edit.component').then(m => m.PurchaseRequestEditComponent),
    canActivate: [AuthGuard, PurchaseRequestEditGuard]
  },
  {
    path: 'show/:id',
    loadComponent: () => import('./purchase-request-show/purchase-request-show.component').then(m => m.PurchaseRequestShowComponent),
    canActivate: [AuthGuard, PurchaseRequestViewGuard]
  },
  {
    path: 'preauthorize/:id',
    loadComponent: () => import('./purchase-request-preauthorize/purchase-request-preauthorize.component').then(m => m.PurchaseRequestPreauthorizeComponent),
    canActivate: [AuthGuard, PurchaseRequestPreauthorizeGuard]
  },
  {
    path: 'pending-preauthorization',
    loadComponent: () => import('./purchase-request-list/purchase-request-list.component').then(m => m.PurchaseRequestListComponent),
    canActivate: [AuthGuard, PurchaseRequestPreauthorizeGuard],
    data: { mode: 'pending-preauthorization' }
  },
  {
    path: 'my-authorizations',
    loadComponent: () => import('./my-pending-authorizations/my-pending-authorizations.component').then(m => m.MyPendingAuthorizationsComponent),
    canActivate: [AuthGuard, MyAuthorizationsGuard],
    data: { title: 'Mis Autorizaciones Pendientes' }
  },
  {
    path: 'tracking',
    loadComponent: () => import('./purchase-tracking/purchase-tracking.component').then(m => m.PurchaseTrackingComponent),
    canActivate: [AuthGuard, PurchaseTrackingGuard],
    data: { title: 'Seguimiento de Compras' }
  },
  {
    path: ':id',
    loadComponent: () => import('./purchase-request-show/purchase-request-show.component').then(m => m.PurchaseRequestShowComponent),
    canActivate: [AuthGuard, PurchaseRequestViewGuard]
  },
  {
    path: ':id/pre-authorize',
    loadComponent: () => import('./purchase-request-preauthorize/purchase-request-preauthorize.component').then(m => m.PurchaseRequestPreauthorizeComponent),
    canActivate: [AuthGuard, PurchaseRequestPreauthorizeGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PurchaseRequestsRoutingModule { }
