import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../auth.guard';
import { PruebasListComponent } from './pruebas-list/pruebas-list.component';
import { PruebaAddComponent } from './prueba-add/prueba-add.component';
import { PruebaShowComponent } from './prueba-show/prueba-show.component';
import { PruebaEditComponent } from './prueba-edit/prueba-edit.component';
import {
  PruebaListGuard,
  PruebaViewGuard,
  PruebaCreateGuard,
  PruebaEditGuard,
} from './guards/prueba-permission.guards';

const routes: Routes = [
  // Pruebas list
  {
    path: 'list',
    component: PruebasListComponent,
    canActivate: [AuthGuard, PruebaListGuard],
  },
  // Prueba add
  {
    path: 'add',
    component: PruebaAddComponent,
    canActivate: [AuthGuard, PruebaCreateGuard],
  },
  // Prueba show
  {
    path: 'show/:id',
    component: PruebaShowComponent,
    canActivate: [AuthGuard, PruebaViewGuard],
  },
  // Prueba edit
  {
    path: 'edit/:id',
    component: PruebaEditComponent,
    canActivate: [AuthGuard, PruebaEditGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PruebasRoutingModule {}
