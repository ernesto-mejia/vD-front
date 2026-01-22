import { RoleEditComponent } from './role-edit/role-edit.component';
import { RoleShowComponent } from './role-show/role-show.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RolesListComponent } from './roles-list/roles-list.component';
import { RoleAddComponent } from './role-add/role-add.component';
import { AuthGuard } from '../../../auth.guard';
import {
  RoleListGuard,
  RoleViewGuard,
  RoleCreateGuard,
  RoleEditGuard,
} from '../../user/role/guards/role-permission.guards';

const routes: Routes = [
  {
    path: '', // Este es el path para el módulo "roles"
    children: [
      {
        path: 'list', // Ruta hija para listar los roles
        component: RolesListComponent,
        canActivate: [AuthGuard, RoleListGuard],
      },
      {
        path: 'add', // Ruta hija para agregar un rol
        component: RoleAddComponent,
        canActivate: [AuthGuard, RoleCreateGuard],
      },
      {
        path: 'show/:id', // Ruta hija para mostrar un rol específico
        component: RoleShowComponent,
        canActivate: [AuthGuard, RoleViewGuard],
      },
      {
        path: 'edit/:id',
        component: RoleEditComponent,
        canActivate: [AuthGuard, RoleEditGuard],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RoleRoutingModule {}
