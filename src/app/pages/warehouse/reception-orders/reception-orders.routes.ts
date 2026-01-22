import { Routes } from '@angular/router';
import { AuthGuard } from '../../../auth.guard';
import {
  ReceptionOrderListGuard,
  ReceptionOrderViewGuard,
  ReceptionOrderReceiveGuard
} from './guards/reception-order-permission.guards';

export const receptionOrdersRoutes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    loadComponent: () => import('./reception-order-list/reception-order-list.component')
      .then(m => m.ReceptionOrderListComponent),
    canActivate: [AuthGuard, ReceptionOrderListGuard],
    data: { title: 'Órdenes de Recepción' }
  },
  {
    path: 'pending',
    loadComponent: () => import('./reception-order-pending/reception-order-pending.component')
      .then(m => m.ReceptionOrderPendingComponent),
    canActivate: [AuthGuard, ReceptionOrderListGuard],
    data: { title: 'Recepciones Pendientes' }
  },
  {
    path: 'show/:id',
    loadComponent: () => import('./reception-order-show/reception-order-show.component')
      .then(m => m.ReceptionOrderShowComponent),
    canActivate: [AuthGuard, ReceptionOrderViewGuard],
    data: { title: 'Detalle de Orden de Recepción' }
  },
  {
    path: 'receive/:id',
    loadComponent: () => import('./reception-order-receive/reception-order-receive.component')
      .then(m => m.ReceptionOrderReceiveComponent),
    canActivate: [AuthGuard, ReceptionOrderReceiveGuard],
    data: { title: 'Registrar Recepción' }
  }
];
