import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ContractsListComponent } from './contracts-list/contracts-list.component';
import { ContractAddComponent } from './contract-add/contract-add.component';
import { AuthGuard } from '../../../auth.guard';
import {
  ContractProviderListGuard,
  ContractProviderViewGuard,
  ContractProviderCreateGuard,
  ContractProviderEditGuard
} from './guards/contract-provider-permission.guards';

const routes: Routes = [
  { path: '', component: ContractsListComponent, canActivate: [AuthGuard, ContractProviderListGuard] },
  { path: 'add', component: ContractAddComponent, canActivate: [AuthGuard, ContractProviderCreateGuard] },
  { path: 'edit/:id', loadComponent: () => import('./contract-edit/contract-edit.component').then(m => m.ContractEditComponent), canActivate: [AuthGuard, ContractProviderEditGuard] },
  { path: 'show/:id', loadComponent: () => import('./contract-show/contract-show.component').then(m => m.ContractShowComponent), canActivate: [AuthGuard, ContractProviderViewGuard] }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ContractsProvidersRoutingModule { }
