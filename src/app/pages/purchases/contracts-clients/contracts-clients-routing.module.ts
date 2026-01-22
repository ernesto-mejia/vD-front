import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ContractsListComponent } from './contracts-list/contracts-list.component';
import { ContractAddComponent } from './contract-add/contract-add.component';
import { AuthGuard } from '../../../auth.guard';
import {
  ContractClientListGuard,
  ContractClientViewGuard,
  ContractClientCreateGuard,
  ContractClientEditGuard
} from './guards/contract-client-permission.guards';

const routes: Routes = [
  { path: '', component: ContractsListComponent, canActivate: [AuthGuard, ContractClientListGuard] },
  { path: 'add', component: ContractAddComponent, canActivate: [AuthGuard, ContractClientCreateGuard] },
  { path: 'edit/:id', loadComponent: () => import('./contract-edit/contract-edit.component').then(m => m.ContractEditComponent), canActivate: [AuthGuard, ContractClientEditGuard] },
  { path: 'show/:id', loadComponent: () => import('./contract-show/contract-show.component').then(m => m.ContractShowComponent), canActivate: [AuthGuard, ContractClientViewGuard] }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ContractsClientsRoutingModule { }
