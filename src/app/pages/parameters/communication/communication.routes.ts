import { Routes } from '@angular/router';
import { AuthGuard } from '../../../core/guards/auth.guard';

export const communicationRoutes: Routes = [
  {
    path: '',
    redirectTo: 'email-configuration',
    pathMatch: 'full'
  },
  {
    path: 'email-configuration',
    loadComponent: () => import('./email-configuration/email-configuration.component').then(m => m.EmailConfigurationComponent),
    canActivate: [AuthGuard],
    data: { title: 'Configuración de Email' }
  },
  {
    path: 'announcements',
    loadComponent: () => import('./announcements/announcements.component').then(m => m.AnnouncementsComponent),
    canActivate: [AuthGuard],
    data: { title: 'Anuncios' }
  },
  {
    path: 'chat',
    loadComponent: () => import('./chat/chat.component').then(m => m.ChatComponent),
    canActivate: [AuthGuard],
    data: { title: 'Chat Interno' }
  }
];
