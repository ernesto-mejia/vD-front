import { Routes } from '@angular/router';
import { AuthGuard } from '../../../core/guards/auth.guard';
import {
  LogsListGuard,
  LogsViewGuard
} from './guards/logs-permission.guards';

export const logsRoutes: Routes = [
  {
    path: 'list',
    loadComponent: () => import('./logs-list/logs-list.component').then(m => m.LogsListComponent),
    canActivate: [AuthGuard, LogsListGuard],
  },
  {
    path: 'show/:id',
    loadComponent: () => import('./log-show/log-show.component').then(m => m.LogShowComponent),
    canActivate: [AuthGuard, LogsViewGuard],
  }
];
