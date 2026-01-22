import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommunicationService } from '../services/communication.service';
import {
  Announcement,
  AnnouncementType,
  AnnouncementPriority,
  AnnouncementScope,
  ANNOUNCEMENT_TYPES,
  ANNOUNCEMENT_PRIORITIES,
  ANNOUNCEMENT_SCOPES
} from '../models/communication.model';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DatePipe, SidebarComponent],
  templateUrl: './announcements.component.html',
  styleUrls: ['./announcements.component.scss']
})
export class AnnouncementsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private communicationService = inject(CommunicationService);

  // Signals
  announcements = signal<Announcement[]>([]);
  loading = signal(false);
  showModal = signal(false);
  editingId = signal<number | null>(null);
  selectedAnnouncement = signal<Announcement | null>(null);
  showViewModal = signal(false);

  // Filters
  filterStatus = signal<string>('');
  filterType = signal<string>('');
  searchQuery = signal<string>('');

  // Form
  form!: FormGroup;

  // Constants
  readonly types = ANNOUNCEMENT_TYPES;
  readonly priorities = ANNOUNCEMENT_PRIORITIES;
  readonly scopes = ANNOUNCEMENT_SCOPES;
  readonly statuses = [
    { value: '', label: 'Todos' },
    { value: 'draft', label: 'Borrador' },
    { value: 'scheduled', label: 'Programado' },
    { value: 'active', label: 'Activo' },
    { value: 'expired', label: 'Expirado' },
    { value: 'archived', label: 'Archivado' }
  ];

  // Computed
  isEditing = computed(() => this.editingId() !== null);
  modalTitle = computed(() => this.isEditing() ? 'Editar Anuncio' : 'Nuevo Anuncio');

  selectedScope = computed(() => this.form?.get('scope')?.value as AnnouncementScope);
  needsCompanySelect = computed(() => this.selectedScope() === 'company');
  needsRoleSelect = computed(() => this.selectedScope() === 'role');
  needsDepartmentSelect = computed(() => this.selectedScope() === 'department');
  needsUserSelect = computed(() => this.selectedScope() === 'user');

  ngOnInit(): void {
    this.initForm();
    this.loadAnnouncements();
  }

  private initForm(): void {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      content: ['', Validators.required],
      type: ['info', Validators.required],
      priority: ['normal', Validators.required],
      scope: ['all', Validators.required],
      target_companies: [[]],
      target_roles: [[]],
      target_departments: [[]],
      target_users: [[]],
      starts_at: [''],
      expires_at: [''],
      is_pinned: [false],
      is_modal: [false],
      requires_acknowledgment: [false],
      action_url: [''],
      action_text: [''],
      image_url: [''],
      status: ['active', Validators.required]
    });
  }

  loadAnnouncements(): void {
    this.loading.set(true);
    this.communicationService.getAdminAnnouncements({
      status: this.filterStatus(),
      type: this.filterType(),
      search: this.searchQuery()
    }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.announcements.set(response.data.data || []);
        }
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading announcements:', error);
        this.loading.set(false);
        Swal.fire('Error', 'No se pudieron cargar los anuncios', 'error');
      }
    });
  }

  onFilterChange(): void {
    this.loadAnnouncements();
  }

  openCreateModal(): void {
    this.editingId.set(null);
    this.form.reset({
      type: 'info',
      priority: 'normal',
      scope: 'all',
      status: 'active',
      is_pinned: false,
      is_modal: false,
      requires_acknowledgment: false
    });
    this.showModal.set(true);
  }

  openEditModal(announcement: Announcement): void {
    this.editingId.set(announcement.id);
    this.form.patchValue({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      scope: announcement.scope,
      target_companies: announcement.target_companies || [],
      target_roles: announcement.target_roles || [],
      target_departments: announcement.target_departments || [],
      target_users: announcement.target_users || [],
      starts_at: announcement.starts_at ? this.formatDateForInput(announcement.starts_at) : '',
      expires_at: announcement.expires_at ? this.formatDateForInput(announcement.expires_at) : '',
      is_pinned: announcement.is_pinned,
      is_modal: announcement.is_modal,
      requires_acknowledgment: announcement.requires_acknowledgment,
      action_url: announcement.action_url || '',
      action_text: announcement.action_text || '',
      image_url: announcement.image_url || '',
      status: announcement.status
    });
    this.showModal.set(true);
  }

  openViewModal(announcement: Announcement): void {
    this.selectedAnnouncement.set(announcement);
    this.showViewModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingId.set(null);
  }

  closeViewModal(): void {
    this.showViewModal.set(false);
    this.selectedAnnouncement.set(null);
  }

  private formatDateForInput(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  }

  save(): void {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
      return;
    }

    const data = { ...this.form.value };
    this.loading.set(true);

    // Clean up empty arrays based on scope
    if (data.scope !== 'company') data.target_companies = [];
    if (data.scope !== 'role') data.target_roles = [];
    if (data.scope !== 'department') data.target_departments = [];
    if (data.scope !== 'user') data.target_users = [];

    // Remove empty optional fields
    if (!data.starts_at) delete data.starts_at;
    if (!data.expires_at) delete data.expires_at;
    if (!data.action_url) delete data.action_url;
    if (!data.action_text) delete data.action_text;
    if (!data.image_url) delete data.image_url;

    const request = this.isEditing()
      ? this.communicationService.updateAnnouncement(this.editingId()!, data)
      : this.communicationService.createAnnouncement(data);

    request.subscribe({
      next: (response: { success: boolean; message: string }) => {
        if (response.success) {
          Swal.fire('Éxito', response.message, 'success');
          this.closeModal();
          this.loadAnnouncements();
        }
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error saving announcement:', error);
        this.loading.set(false);
        Swal.fire('Error', error.error?.message || 'No se pudo guardar el anuncio', 'error');
      }
    });
  }

  delete(announcement: Announcement): void {
    Swal.fire({
      title: '¿Eliminar anuncio?',
      text: `¿Está seguro de eliminar "${announcement.title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.loading.set(true);
        this.communicationService.deleteAnnouncement(announcement.id).subscribe({
          next: (response: { success: boolean; message: string }) => {
            if (response.success) {
              Swal.fire('Eliminado', response.message, 'success');
              this.loadAnnouncements();
            }
            this.loading.set(false);
          },
          error: (error: any) => {
            console.error('Error deleting announcement:', error);
            this.loading.set(false);
            Swal.fire('Error', 'No se pudo eliminar el anuncio', 'error');
          }
        });
      }
    });
  }

  getTypeConfig(type: AnnouncementType) {
    return this.types.find(t => t.value === type) || this.types[0];
  }

  getStatusBadge(status: string): { class: string; text: string } {
    const badges: Record<string, { class: string; text: string }> = {
      draft: { class: 'bg-secondary', text: 'Borrador' },
      scheduled: { class: 'bg-info', text: 'Programado' },
      active: { class: 'bg-success', text: 'Activo' },
      expired: { class: 'bg-warning text-dark', text: 'Expirado' },
      archived: { class: 'bg-dark', text: 'Archivado' }
    };
    return badges[status] || badges['draft'];
  }

  getPriorityBadge(priority: AnnouncementPriority): string {
    const badges: Record<AnnouncementPriority, string> = {
      low: 'bg-secondary',
      normal: 'bg-primary',
      high: 'bg-warning text-dark',
      critical: 'bg-danger'
    };
    return badges[priority] || 'bg-primary';
  }
}
