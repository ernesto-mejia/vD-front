import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PermissionRoutingModule } from './permission-routing.module';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { PermissionShowComponent } from './permission-show/permission-show.component';
import { PermissionEditComponent } from './permission-edit/permission-edit.component';
import { PermissionAddComponent } from './permission-add/permission-add.component';
import { PermissionsListComponent } from './permissions-list/permissions-list.component';
import { FormsModule } from '@angular/forms';
import { DataTablesModule } from 'angular-datatables';


@NgModule({
  declarations: [
    PermissionShowComponent,
    PermissionEditComponent,
    PermissionAddComponent,
    PermissionsListComponent
  ],
  imports: [
    CommonModule,
    PermissionRoutingModule,
    SidebarComponent,
    FormsModule,
    DataTablesModule
  ]
})
export class PermissionModule { }
