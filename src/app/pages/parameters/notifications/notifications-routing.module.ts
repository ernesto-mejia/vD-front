import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotificationsInboxComponent } from './notifications-inbox/notifications-inbox.component';
import { NotificationEditComponent } from './admin/notification-edit/notification-edit.component';
import { NotificationCreateComponent } from './admin/notification-create/notification-create.component';
import { NotificationDetailComponent } from './notification-detail/notification-detail.component';
import { AuthGuard } from '../../../core/guards/auth.guard';
import { NotificationsAdminComponent } from './admin/notifications-admin.component';
import {
  NotificationListGuard,
  NotificationViewGuard,
  NotificationCreateGuard,
  NotificationEditGuard,
  NotificationAdminGuard,
  NotificationInboxGuard
} from './guards/notification-permission.guards';

const routes: Routes = [
        // Notifications
        {
          path: 'list',
          component: NotificationsAdminComponent,
          canActivate: [AuthGuard, NotificationAdminGuard],
        },
        {
          path: 'inbox',
          component: NotificationsInboxComponent,
          canActivate: [AuthGuard, NotificationInboxGuard],
        },
        {
          path: 'admin/add',
          component: NotificationCreateComponent,
          canActivate: [AuthGuard, NotificationCreateGuard],
        },
        {
          path: 'admin/edit/:id',
          component: NotificationEditComponent,
          canActivate: [AuthGuard, NotificationEditGuard],
        },
        {
          path: 'admin/view/:id',
          component: NotificationDetailComponent,
          canActivate: [AuthGuard, NotificationViewGuard],
        },
        {
          path: 'edit/:id',
          component: NotificationEditComponent,
          canActivate: [AuthGuard, NotificationEditGuard],
        },
        {
          path: 'show/:id',
          component: NotificationDetailComponent,
          canActivate: [AuthGuard, NotificationViewGuard],
        },
        // Ruta para ver notificación individual desde inbox o toast (notifications/:id)
        {
          path: 'detail/:id',
          component: NotificationDetailComponent,
          canActivate: [AuthGuard, NotificationViewGuard],
        },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NotificationsRoutingModule { }
