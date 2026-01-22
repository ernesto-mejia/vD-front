import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { SidebarComponent } from '../../../sidebar/sidebar.component';
import { LicitationService } from '../licitation.service';
import { LicitationPermissionService } from '../services/licitation-permission.service';
import { Licitation, ConvertToContractRequest, canConvertToContract } from '../licitation.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-licitation-convert',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './licitation-convert.component.html',
  styleUrls: ['./licitation-convert.component.css']
})
export class LicitationConvertComponent implements OnInit {

  licitation: Licitation | null = null;
  form: FormGroup;
  loading = true;
  saving = false;

  regions: { id: number; code: string; name: string }[] = [];

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
    if (!this.permissions.canConvert()) {
      Swal.fire('Sin permiso', 'No tiene permiso para convertir licitaciones.', 'warning');
      this.router.navigate(['/purchases/licitations']);
      return;
    }

    this.loadRegions();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadLicitation(parseInt(id, 10));
    } else {
      this.router.navigate(['/purchases/licitations']);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      project_name: ['', [Validators.required, Validators.maxLength(255)]],
      region_id: ['', Validators.required],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      min_amount: ['', [Validators.required, Validators.min(0)]],
      max_amount: ['', [Validators.required, Validators.min(0)]],
      contract_number: ['', Validators.maxLength(100)],
      reference_number: ['', Validators.maxLength(100)],
      description: [''],
    });
  }

  loadRegions(): void {
    this.licitationService.getRegions().subscribe(regions => {
      this.regions = regions;
    });
  }

  loadLicitation(id: number): void {
    this.loading = true;

    this.licitationService.getById(id).subscribe({
      next: (response) => {
        this.licitation = response.data;

        // Verificar que pueda ser convertida
        if (!canConvertToContract(this.licitation)) {
          Swal.fire(
            'No disponible',
            'Esta licitación no puede ser convertida a contrato. Debe estar en estado "Ganada" y no tener contratos existentes.',
            'warning'
          );
          this.router.navigate(['/purchases/licitations/show', id]);
          return;
        }

        // Pre-llenar formulario con datos de la licitación
        this.form.patchValue({
          project_name: this.licitation.description?.substring(0, 255) || '',
          description: this.licitation.description,
          min_amount: this.licitation.won_amount || this.licitation.estimated_amount || 0,
          max_amount: this.licitation.won_amount || this.licitation.estimated_amount || 0,
          contract_number: this.licitation.licitation_number + '-C',
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
    if (this.form.invalid || !this.licitation) {
      this.markFormGroupTouched();
      Swal.fire('Formulario incompleto', 'Por favor complete los campos requeridos.', 'warning');
      return;
    }

    // Validar que max >= min
    const minAmount = parseFloat(this.form.get('min_amount')?.value);
    const maxAmount = parseFloat(this.form.get('max_amount')?.value);
    if (maxAmount < minAmount) {
      Swal.fire('Error', 'El monto máximo debe ser mayor o igual al monto mínimo.', 'error');
      return;
    }

    Swal.fire({
      title: '¿Convertir a contrato?',
      html: `
        <p>Esta acción creará un nuevo contrato de cliente a partir de la licitación <strong>${this.licitation.licitation_number}</strong>.</p>
        <p class="text-muted small">La licitación quedará marcada como "Convertida" y no podrá modificarse.</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      confirmButtonText: 'Sí, crear contrato',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.doConvert();
      }
    });
  }

  private doConvert(): void {
    this.saving = true;

    const data: ConvertToContractRequest = {
      project_name: this.form.get('project_name')?.value,
      region_id: parseInt(this.form.get('region_id')?.value, 10),
      start_date: this.form.get('start_date')?.value,
      end_date: this.form.get('end_date')?.value,
      min_amount: parseFloat(this.form.get('min_amount')?.value),
      max_amount: parseFloat(this.form.get('max_amount')?.value),
      contract_number: this.form.get('contract_number')?.value || undefined,
      reference_number: this.form.get('reference_number')?.value || undefined,
      description: this.form.get('description')?.value || undefined,
    };

    this.licitationService.convertToContract(this.licitation!.id_licitation!, data).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: '¡Contrato creado!',
          html: `
            <p>El contrato <strong>${response.data.contract.contract_number}</strong> ha sido creado exitosamente.</p>
          `,
          confirmButtonText: 'Ver contrato',
          showCancelButton: true,
          cancelButtonText: 'Volver a licitaciones'
        }).then((result) => {
          if (result.isConfirmed) {
            this.router.navigate(['/purchases/contracts-clients/show', response.data.contract.id]);
          } else {
            this.router.navigate(['/purchases/licitations']);
          }
        });
      },
      error: (err) => {
        this.saving = false;
        const errorMsg = err.error?.message || 'Error al convertir la licitación';
        Swal.fire('Error', errorMsg, 'error');
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      this.form.get(key)?.markAsTouched();
    });
  }

  cancel(): void {
    if (this.licitation) {
      this.router.navigate(['/purchases/licitations/show', this.licitation.id_licitation]);
    } else {
      this.router.navigate(['/purchases/licitations']);
    }
  }

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

  formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  }
}
