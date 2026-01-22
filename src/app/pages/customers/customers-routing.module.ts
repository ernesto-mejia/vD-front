import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomersListComponent } from './customers-list/customers-list.component';
import { AuthGuard } from '../../core/guards/auth.guard';
import { CustomerAddComponent } from './customer-add/customer-add.component';
import { CustomerEditComponent } from './customer-edit/customer-edit.component';
import { CustomerShowComponent } from './customer-show/customer-show.component';
import {
  CustomerListGuard,
  CustomerViewGuard,
  CustomerCreateGuard,
  CustomerEditGuard
} from './guards/customer-permission.guards';

const routes: Routes = [

      //JARED - Customers List Route
      {
        path: 'list',
        component: CustomersListComponent,
        canActivate: [AuthGuard, CustomerListGuard],
      },
      //JARED - Customers Add Route
      {
        path: 'add',
        component: CustomerAddComponent,
        canActivate: [AuthGuard, CustomerCreateGuard],
      },
      //JARED - Customers Edit Route
      {
        path: 'edit/:id',
        component: CustomerEditComponent,
        canActivate: [AuthGuard, CustomerEditGuard],
      },
      //JARED - Customers Show Route
      {
        path: 'show/:id',
        component: CustomerShowComponent,
        canActivate: [AuthGuard, CustomerViewGuard],
      }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CustomersRoutingModule { }
