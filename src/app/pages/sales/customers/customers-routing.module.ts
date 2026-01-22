import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../../core/guards/auth.guard';
import { CustomersListGenericComponent } from './customers-list-generic.wrapper';
import { CustomerShowGenericComponent } from './customer-show-generic.wrapper';
import { CustomerEditGenericComponent } from './customer-edit-generic.wrapper';

const routes: Routes = [
  // {
  //   path: 'listv2',
  //   component: CustomersListComponent,
  //   canActivate: [AuthGuard],
  // },
  //JARED - Customers List Route
  {
    path: 'list',
    component: CustomersListGenericComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'customer-show/:id',
    component: CustomerShowGenericComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'customer-edit/:id',
    component: CustomerEditGenericComponent,
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CustomersRoutingModule {}
