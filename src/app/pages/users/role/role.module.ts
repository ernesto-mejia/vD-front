import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleRoutingModule } from './role-routing.module';
import { RoleAddComponent } from './role-add/role-add.component';
import { RoleShowComponent } from './role-show/role-show.component';
import { RoleEditComponent } from './role-edit/role-edit.component';
import { RolesListComponent } from './roles-list/roles-list.component';
import { RoleFormComponent } from './role-form/role-form.component';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { DataTablesModule } from 'angular-datatables';


@NgModule({
  declarations: [
    RoleShowComponent,
    RolesListComponent,
    RoleAddComponent,
    RoleEditComponent,
    RoleFormComponent
  ],
  imports: [
    CommonModule,
    RoleRoutingModule,
    SidebarComponent,
    FormsModule,
    DataTablesModule,
  ]
})
export class RoleModule { }
