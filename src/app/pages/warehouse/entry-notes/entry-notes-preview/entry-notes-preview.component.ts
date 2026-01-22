import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { EntryNote, EntryNotesService } from '../entry-notes.service';

@Component({
  selector: 'app-entry-notes-preview',
  templateUrl: './entry-notes-preview.component.html',
  styleUrls: ['./entry-notes-preview.component.css'],
})
export class EntryNotesPreviewComponent implements OnInit {
  note: EntryNote | null = null;
  loading = false;

  constructor(
    private entryNotesService: EntryNotesService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadNote(id);
  }

  private loadNote(id: number): void {
    this.loading = true;
    this.entryNotesService.getEntryNote(id).subscribe({
      next: (note) => {
        this.note = note;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar nota de entrada:', error);
        this.loading = false;
      },
    });
  }

  goBack(): void {
    this.location.back();
  }

  goToScan(): void {
    if (this.note) {
      this.router.navigate(['/entry-notes/scan', this.note.id]);
    }
  }
}
