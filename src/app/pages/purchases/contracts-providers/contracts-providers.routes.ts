import { Routes } from '@angular/router';
import { AuthGuard } from '../../../auth.guard';
import {
  ContractProviderListGuard,
  ContractProviderViewGuard,
  ContractProviderCreateGuard,
  ContractProviderEditGuard
} from './guards/contract-provider-permission.guards';

export const contractsProvidersRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./contracts-list/contracts-list.component').then(m => m.ContractsListComponent),
    canActivate: [AuthGuard, ContractProviderListGuard]
  },
  {
    path: 'add',
    loadComponent: () => import('./contract-add/contract-add.component').then(m => m.ContractAddComponent),
    canActivate: [AuthGuard, ContractProviderCreateGuard]
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./contract-edit/contract-edit.component').then(m => m.ContractEditComponent),
    canActivate: [AuthGuard, ContractProviderEditGuard]
  },
  {
    path: 'show/:id',
    loadComponent: () => import('./contract-show/contract-show.component').then(m => m.ContractShowComponent),
    canActivate: [AuthGuard, ContractProviderViewGuard]
  }
];
