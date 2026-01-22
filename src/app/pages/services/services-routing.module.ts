import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../auth.guard';
import { ServicesListComponent } from './services-list/services-list.component';
import { ServiceAddComponent } from './service-add/service-add.component';
import { ServiceShowComponent } from './service-show/service-show.component';
import { ServiceEditComponent } from './service-edit/service-edit.component';
import {
  ServiceListGuard,
  ServiceViewGuard,
  ServiceCreateGuard,
  ServiceEditGuard
} from './guards/service-permission.guards';


const routes: Routes = [
  // Services list
  {
    path: 'list',
    component: ServicesListComponent,
    canActivate: [AuthGuard, ServiceListGuard],
  },
  // Service add
  {
    path: 'add',
    component: ServiceAddComponent,
    canActivate: [AuthGuard, ServiceCreateGuard],
  },
  // Service show
  {
    path: 'show/:id',
    component: ServiceShowComponent,
    canActivate: [AuthGuard, ServiceViewGuard],
  },
  // Service edit
  {
    path: 'edit/:id',
    component: ServiceEditComponent,
    canActivate: [AuthGuard, ServiceEditGuard],
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ServicesRoutingModule { }
