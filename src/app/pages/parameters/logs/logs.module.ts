import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { LogsRoutingModule } from './logs-routing.module';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { LogsListComponent } from './logs-list/logs-list.component';
import { LogShowComponent } from './log-show/log-show.component';
import { LogsService } from './logs.service';


@NgModule({
  declarations: [
    // LogsListComponent y LogShowComponent ahora son standalone
    LogShowComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    LogsRoutingModule,
    SidebarComponent,
    LogsListComponent  // Importar componente standalone
  ],
  providers: [
    LogsService
  ]
})
export class LogsModule { }
