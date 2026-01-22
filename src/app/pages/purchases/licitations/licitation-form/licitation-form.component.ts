import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { SidebarComponent } from '../../../sidebar/sidebar.component';
import { LicitationService } from '../licitation.service';
import { LicitationPermissionService } from '../services/licitation-permission.service';
import { Licitation, LicitationCreateRequest, LICITATION_STATUS_OPTIONS } from '../licitation.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-licitation-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './licitation-form.component.html',
  styleUrls: ['./licitation-form.component.css']
})
export class LicitationFormComponent implements OnInit {

  form: FormGroup;
  isEditMode = false;
  licitationId: number | null = null;
  loading = false;
  saving = false;

  clients: { id: number; name: string; tax_id?: string }[] = [];
  statusOptions = LICITATION_STATUS_OPTIONS.filter(s =>
    ['draft', 'submitted', 'in_review'].includes(s.value)
  );

  pageTitle = 'Nueva Licitación';

  constructor(
    private fb: FormBuilder,
    private licitationService: LicitationService,
    public permissions: LicitationPermissionService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.createForm();
  }

  ngOnInit(): void {
    this.loadClients();

    // Verificar si es modo edición
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.licitationId = parseInt(id, 10);
      this.pageTitle = 'Editar Licitación';
      this.loadLicitation();
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      licitation_number: ['', [Validators.required, Validators.maxLength(45)]],
      id_company: ['', Validators.required],
      licitation_date: ['', Validators.required],
      description: ['', Validators.maxLength(1000)],
      status: ['draft'],

      // Fechas del proceso
      submission_deadline: [''],
      resolution_date: [''],

      // Montos
      estimated_amount: ['', [Validators.min(0)]],

      // Campos legacy del proceso
      licitation_basis: [''],
      demand_per_unit: [''],
      clarification_meeting: [''],
      technical_offer: [''],
      economic_proposal: [''],

      // Archivos
      digital_file: [false],
      digital_file_location: ['', Validators.maxLength(255)],

      // Notas
      notes: [''],
    });
  }

  loadClients(): void {
    this.licitationService.getClients().subscribe(clients => {
      this.clients = clients;
    });
  }

  loadLicitation(): void {
    if (!this.licitationId) return;

    this.loading = true;
    this.licitationService.getById(this.licitationId).subscribe({
      next: (response) => {
        const lic = response.data;
        this.form.patchValue({
          licitation_number: lic.licitation_number,
          id_company: lic.id_company,
          licitation_date: lic.licitation_date?.split('T')[0],
          description: lic.description,
          status: lic.status,
          submission_deadline: lic.submission_deadline?.split('T')[0],
          resolution_date: lic.resolution_date?.split('T')[0],
          estimated_amount: lic.estimated_amount,
          licitation_basis: lic.licitation_basis,
          demand_per_unit: lic.demand_per_unit,
          clarification_meeting: lic.clarification_meeting,
          technical_offer: lic.technical_offer,
          economic_proposal: lic.economic_proposal,
          digital_file: lic.digital_file,
          digital_file_location: lic.digital_file_location,
          notes: lic.notes,
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading licitation:', err);
        Swal.fire('Error', 'No se pudo cargar la licitación', 'error');
        this.router.navigate(['/purchases/licitations']);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.markFormGroupTouched();
      Swal.fire('Formulario incompleto', 'Por favor complete los campos requeridos.', 'warning');
      return;
    }

    this.saving = true;
    const formData = this.prepareFormData();

    const request$ = this.isEditMode
      ? this.licitationService.update(this.licitationId!, formData)
      : this.licitationService.create(formData);

    request$.subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: this.isEditMode ? 'Licitación actualizada' : 'Licitación creada',
          text: response.message || 'La licitación ha sido guardada exitosamente.',
          timer: 2000,
          showConfirmButton: false
        });
        this.router.navigate(['/purchases/licitations']);
      },
      error: (err) => {
        this.saving = false;
        const errorMsg = err.error?.message || 'Error al guardar la licitación';
        Swal.fire('Error', errorMsg, 'error');
      }
    });
  }

  private prepareFormData(): LicitationCreateRequest {
    const value = this.form.value;

    // Limpiar valores vacíos
    const data: any = {};
    Object.keys(value).forEach(key => {
      const v = value[key];
      if (v !== '' && v !== null && v !== undefined) {
        data[key] = v;
      }
    });

    return data;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      this.form.get(key)?.markAsTouched();
    });
  }

  cancel(): void {
    this.router.navigate(['/purchases/licitations']);
  }

  // Helpers para validación
  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  getFieldError(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'Este campo es requerido';
    if (field.errors['maxlength']) return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
    if (field.errors['min']) return `El valor mínimo es ${field.errors['min'].min}`;

    return 'Campo inválido';
  }
}
