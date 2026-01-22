import { Routes } from '@angular/router';
import { AuthGuard } from '../../../auth.guard';

export const licitationsRoutes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full'
      },
      {
        path: 'list',
        loadComponent: () => import('./licitations-list/licitations-list.component')
          .then(m => m.LicitationsListComponent),
        title: 'Licitaciones - EPICA'
      },
      {
        path: 'add',
        loadComponent: () => import('./licitation-form/licitation-form.component')
          .then(m => m.LicitationFormComponent),
        title: 'Nueva Licitación - EPICA'
      },
      {
        path: 'edit/:id',
        loadComponent: () => import('./licitation-form/licitation-form.component')
          .then(m => m.LicitationFormComponent),
        title: 'Editar Licitación - EPICA'
      },
      {
        path: 'show/:id',
        loadComponent: () => import('./licitation-show/licitation-show.component')
          .then(m => m.LicitationShowComponent),
        title: 'Detalle de Licitación - EPICA'
      },
      {
        path: 'convert/:id',
        loadComponent: () => import('./licitation-convert/licitation-convert.component')
          .then(m => m.LicitationConvertComponent),
        title: 'Convertir a Contrato - EPICA'
      }
    ]
  }
];
