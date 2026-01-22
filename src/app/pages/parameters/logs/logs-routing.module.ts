import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../../core/guards/auth.guard';
import { LogsListComponent } from './logs-list/logs-list.component';
import { LogShowComponent } from './log-show/log-show.component';
import {
  LogsListGuard,
  LogsViewGuard
} from './guards/logs-permission.guards';

const routes: Routes = [
  // logs
  {
    path: 'list',
    component: LogsListComponent,
    canActivate: [AuthGuard, LogsListGuard],
  },
  {
    path: 'show/:id',
    component: LogShowComponent,
    canActivate: [AuthGuard, LogsViewGuard],
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LogsRoutingModule { }
