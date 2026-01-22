import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserCreateComponent } from './user-create/user-create.component';
import { UserListComponent } from './user-list/user-list.component';
import { UserViewComponent } from './user-view/user-view.component';
import { UserEditComponent } from './user-edit/user-edit.component';
import { AuthGuard } from '../../../core/guards/auth.guard';
import {
  UserViewGuard,
  UserCreateGuard,
  UserFullEditGuard,
  UserListGuard
} from '../guards/user-permission.guards';

const routes: Routes = [
        {
          path: 'create',
          component: UserCreateComponent,
          canActivate: [AuthGuard, UserCreateGuard],
        },
        {
          path: 'list',
          component: UserListComponent,
          canActivate: [AuthGuard, UserListGuard],
        },
        {
          path: 'view/:userId',
          component: UserViewComponent,
          canActivate: [AuthGuard, UserViewGuard],
        },
        {
          path: 'edit/:userId',
          component: UserEditComponent,
          canActivate: [AuthGuard, UserFullEditGuard],
        },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
