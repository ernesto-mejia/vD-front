import { Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthGuard } from './auth.guard';

import { LoginComponent } from './pages/login/login.component';
import { LayoutComponent } from './pages/layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UnderConstructionComponent } from './pages/under_construction/under_construction.component';
import { NotificationsInboxComponent } from './pages/parameters/notifications/notifications-inbox/notifications-inbox.component';
import { NotificationDetailComponent } from './pages/parameters/notifications/notification-detail/notification-detail.component';
import { NotificationsAdminComponent } from './pages/parameters/notifications/admin/notifications-admin.component';
import { NotificationEditComponent } from './pages/parameters/notifications/admin/notification-edit/notification-edit.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'under_construction',
        component: UnderConstructionComponent,
          canActivate: [AuthGuard],
      },
      {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [AuthGuard],
      },

      //EMC - User Routes
      {
        path: 'users',  // Path padre para las rutas de roles
        loadChildren: () => import('./pages/users/user/user.module').then(m => m.UserModule)
      },


      //EMC Roles Module
      {
        path: 'roles',  // Path padre para las rutas de roles
        loadChildren: () => import('./pages/users/role/role.module').then(m => m.RoleModule)
      },
      //EMC Permisos Module
      {
        path: 'permissions',  // Path padre para las rutas de permisos
        loadChildren: () => import('./pages/users/permission/permission.module').then(m => m.PermissionModule)
      },

      //EMC Notificaciones Module (Standalone Routes)
      {
        path: 'notifications',
        loadChildren: () => import('./pages/parameters/notifications/notifications.routes').then(m => m.notificationsRoutes)
      },

      //EMC Logs Acciones Module (Standalone Routes)
      {
        path: 'logs',
        loadChildren: () => import('./pages/parameters/logs/logs.routes').then(m => m.logsRoutes)
      },


      // EMC Servicios de Comunicación - Standalone Routes
      {
        path: 'parameters/communication',
        loadChildren: () => import('./pages/parameters/communication/communication.routes').then(m => m.communicationRoutes)
      },

    ],
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
