import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PermissionsListComponent } from './permissions-list/permissions-list.component';
import { PermissionAddComponent } from './permission-add/permission-add.component';
import { PermissionShowComponent } from './permission-show/permission-show.component';
import { PermissionEditComponent } from './permission-edit/permission-edit.component';
import { AuthGuard } from '../../../auth.guard';
import {
  PermissionListGuard,
  PermissionViewGuard,
  PermissionCreateGuard,
  PermissionEditGuard,
} from '../../user/permission/guards/permission-permission.guards';

const routes: Routes = [
  {
    path: '', // Este es el path para el módulo "permissions"
    children: [
      {
        path: 'list', // Ruta hija para listar los permisos
        component: PermissionsListComponent,
        canActivate: [AuthGuard, PermissionListGuard],
      },
      {
        path: 'add', // Ruta hija para agregar un permiso
        component: PermissionAddComponent,
        canActivate: [AuthGuard, PermissionCreateGuard],
      },
      {
        path: 'show/:id', // Ruta hija para mostrar un permiso específico
        component: PermissionShowComponent,
        canActivate: [AuthGuard, PermissionViewGuard],
      },
      {
        path: 'edit/:id',
        component: PermissionEditComponent,
        canActivate: [AuthGuard, PermissionEditGuard],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PermissionRoutingModule {}
