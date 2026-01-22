import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PruebasRoutingModule } from './pruebas-routing.module';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { DataTablesModule } from 'angular-datatables';
import { NgSelectModule } from '@ng-select/ng-select';
import { PruebasListComponent } from './pruebas-list/pruebas-list.component';
import { PruebaAddComponent } from './prueba-add/prueba-add.component';
import { PruebaEditComponent } from './prueba-edit/prueba-edit.component';
import { PruebaShowComponent } from './prueba-show/prueba-show.component';

@NgModule({
  declarations: [
    PruebasListComponent,
    PruebaAddComponent,
    PruebaEditComponent,
    PruebaShowComponent,
  ],
  imports: [
    CommonModule,
    PruebasRoutingModule,
    SidebarComponent,
    FormsModule,
    DataTablesModule,
    NgSelectModule,
  ],
})
export class PruebasModule {}
