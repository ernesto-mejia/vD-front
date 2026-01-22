import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EntryNotesRoutingModule } from './entry-notes-routing.module';
import { EntryNotesListComponent } from './entry-notes-list/entry-notes-list.component';
import { EntryNotesPreviewComponent } from './entry-notes-preview/entry-notes-preview.component';
import { EntryNotesScanComponent } from './entry-notes-scan/entry-notes-scan.component';
import { SidebarComponent } from '../../sidebar/sidebar.component';

@NgModule({
  declarations: [
    EntryNotesListComponent,
    EntryNotesPreviewComponent,
    EntryNotesScanComponent,
  ],
  imports: [CommonModule, FormsModule, EntryNotesRoutingModule, SidebarComponent],
})
export class EntryNotesModule {}
