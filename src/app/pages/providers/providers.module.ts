import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProvidersRoutingModule } from './providers-routing.module';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ProviderAddComponent } from './provider-add/provider-add.component';
import { ProviderShowComponent } from './provider-show/provider-show.component';
import { ProvidersListComponent } from './providers-list/providers-list.component';
import { ProviderEditComponent } from './provider-edit/provider-edit.component';
import { FormsModule } from '@angular/forms';
import { DataTablesModule } from 'angular-datatables';
import { NgSelectModule } from '@ng-select/ng-select';


@NgModule({
  declarations: [
    ProviderAddComponent,
    ProviderShowComponent,
    ProviderEditComponent,
    ProvidersListComponent
  ],
  imports: [
    CommonModule,
    ProvidersRoutingModule,
    SidebarComponent,
    FormsModule,
    DataTablesModule,
    NgSelectModule
  ]
})
export class ProvidersModule { }
