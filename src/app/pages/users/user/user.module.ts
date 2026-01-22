import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserRoutingModule } from './user-routing.module';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { UserListComponent } from './user-list/user-list.component';
import { UserCreateComponent } from './user-create/user-create.component';
import { UserEditComponent } from './user-edit/user-edit.component';
import { UserViewComponent } from './user-view/user-view.component';
import { RolesPermissionsComponent } from './roles-permissions/roles-permissions.component';
import { DataTablesModule } from 'angular-datatables';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { UserNotificationProfileComponent } from '../../parameters/notifications/admin/user-notification-profile/user-notification-profile.component';


@NgModule({
  declarations: [
    UserListComponent,
    UserCreateComponent,
    UserEditComponent,
    UserViewComponent,
    RolesPermissionsComponent
  ],
  imports: [
    CommonModule,
    UserRoutingModule,
    SidebarComponent,
    DataTablesModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    UserNotificationProfileComponent
  ]
})
export class UserModule { }
