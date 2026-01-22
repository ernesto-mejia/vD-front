import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EntryNote, EntryNotesService, EntryNoteStatus } from '../entry-notes.service';

@Component({
  selector: 'app-entry-notes-list',
  templateUrl: './entry-notes-list.component.html',
  styleUrls: ['./entry-notes-list.component.css'],
})
export class EntryNotesListComponent implements OnInit {
  notes: EntryNote[] = [];
  filterStatus: EntryNoteStatus | 'all' = 'pending';
  loading = false;

  constructor(
    private entryNotesService: EntryNotesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadNotes();
  }

  loadNotes(): void {
    this.loading = true;
    this.entryNotesService.getEntryNotes().subscribe({
      next: (notes) => {
        this.notes = notes || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar notas de entrada:', error);
        this.loading = false;
      },
    });
  }

  setFilter(status: EntryNoteStatus | 'all'): void {
    this.filterStatus = status;
  }

  get filteredNotes(): EntryNote[] {
    if (this.filterStatus === 'all') {
      return this.notes;
    }
    return this.notes.filter((note) => note.status === this.filterStatus);
  }

  goToPreview(note: EntryNote): void {
    this.router.navigate(['/entry-notes/preview', note.id]);
  }

  goToScan(note: EntryNote): void {
    this.router.navigate(['/entry-notes/scan', note.id]);
  }
}
