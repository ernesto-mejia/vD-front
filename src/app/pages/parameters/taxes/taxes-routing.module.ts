import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../../auth.guard';
import {
  TaxRulesListGuard,
  TaxRulesViewGuard,
  TaxRulesCreateGuard,
  TaxRulesEditGuard,
  TaxCalculatorGuard
} from './guards/taxes-permission.guards';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'rules',
    pathMatch: 'full'
  },
  {
    path: 'rules',
    loadComponent: () => import('./tax-rules-list/tax-rules-list.component').then(m => m.TaxRulesListComponent),
    canActivate: [AuthGuard, TaxRulesListGuard]
  },
  {
    path: 'rules/add',
    loadComponent: () => import('./tax-rule-add/tax-rule-add.component').then(m => m.TaxRuleAddComponent),
    canActivate: [AuthGuard, TaxRulesCreateGuard]
  },
  {
    path: 'rules/edit/:id',
    loadComponent: () => import('./tax-rule-edit/tax-rule-edit.component').then(m => m.TaxRuleEditComponent),
    canActivate: [AuthGuard, TaxRulesEditGuard]
  },
  {
    path: 'rules/show/:id',
    loadComponent: () => import('./tax-rule-show/tax-rule-show.component').then(m => m.TaxRuleShowComponent),
    canActivate: [AuthGuard, TaxRulesViewGuard]
  },
  {
    path: 'calculator',
    loadComponent: () => import('./tax-calculator/tax-calculator.component').then(m => m.TaxCalculatorComponent),
    canActivate: [AuthGuard, TaxCalculatorGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TaxesRoutingModule { }
