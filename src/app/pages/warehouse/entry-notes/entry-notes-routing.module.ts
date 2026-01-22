import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../../auth.guard';
import { EntryNotesListComponent } from './entry-notes-list/entry-notes-list.component';
import { EntryNotesPreviewComponent } from './entry-notes-preview/entry-notes-preview.component';
import { EntryNotesScanComponent } from './entry-notes-scan/entry-notes-scan.component';

const routes: Routes = [
  {
    path: 'list',
    component: EntryNotesListComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'preview/:id',
    component: EntryNotesPreviewComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'scan/:id',
    component: EntryNotesScanComponent,
    canActivate: [AuthGuard],
  },
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EntryNotesRoutingModule {}
