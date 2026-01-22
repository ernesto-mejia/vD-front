import { Routes } from '@angular/router';
import { AuthGuard } from '../../../auth.guard';
import {
  ContractClientListGuard,
  ContractClientViewGuard,
  ContractClientCreateGuard,
  ContractClientEditGuard
} from './guards/contract-client-permission.guards';

export const contractsClientsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./contracts-list/contracts-list.component').then(m => m.ContractsListComponent),
    canActivate: [AuthGuard, ContractClientListGuard]
  },
  {
    path: 'add',
    loadComponent: () => import('./contract-add/contract-add.component').then(m => m.ContractAddComponent),
    canActivate: [AuthGuard, ContractClientCreateGuard]
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./contract-edit/contract-edit.component').then(m => m.ContractEditComponent),
    canActivate: [AuthGuard, ContractClientEditGuard]
  },
  {
    path: 'show/:id',
    loadComponent: () => import('./contract-show/contract-show.component').then(m => m.ContractShowComponent),
    canActivate: [AuthGuard, ContractClientViewGuard]
  }
];
