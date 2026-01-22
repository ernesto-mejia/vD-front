import { Routes } from '@angular/router';
import { AuthGuard } from '../../../core/guards/auth.guard';
import {
  NotificationListGuard,
  NotificationViewGuard,
  NotificationCreateGuard,
  NotificationEditGuard,
  NotificationAdminGuard,
  NotificationInboxGuard
} from './guards/notification-permission.guards';

export const notificationsRoutes: Routes = [
  // Notifications Admin
  {
    path: 'list',
    loadComponent: () => import('./admin/notifications-admin.component').then(m => m.NotificationsAdminComponent),
    canActivate: [AuthGuard, NotificationAdminGuard],
  },
  {
    path: 'inbox',
    loadComponent: () => import('./notifications-inbox/notifications-inbox.component').then(m => m.NotificationsInboxComponent),
    canActivate: [AuthGuard, NotificationInboxGuard],
  },
  {
    path: 'admin/add',
    loadComponent: () => import('./admin/notification-create/notification-create.component').then(m => m.NotificationCreateComponent),
    canActivate: [AuthGuard, NotificationCreateGuard],
  },
  {
    path: 'admin/edit/:id',
    loadComponent: () => import('./admin/notification-edit/notification-edit.component').then(m => m.NotificationEditComponent),
    canActivate: [AuthGuard, NotificationEditGuard],
  },
  {
    path: 'admin/view/:id',
    loadComponent: () => import('./notification-detail/notification-detail.component').then(m => m.NotificationDetailComponent),
    canActivate: [AuthGuard, NotificationViewGuard],
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./admin/notification-edit/notification-edit.component').then(m => m.NotificationEditComponent),
    canActivate: [AuthGuard, NotificationEditGuard],
  },
  {
    path: 'show/:id',
    loadComponent: () => import('./notification-detail/notification-detail.component').then(m => m.NotificationDetailComponent),
    canActivate: [AuthGuard, NotificationViewGuard],
  },
  // Ruta para ver notificación individual desde inbox o toast
  {
    path: 'detail/:id',
    loadComponent: () => import('./notification-detail/notification-detail.component').then(m => m.NotificationDetailComponent),
    canActivate: [AuthGuard, NotificationViewGuard],
  },
];
