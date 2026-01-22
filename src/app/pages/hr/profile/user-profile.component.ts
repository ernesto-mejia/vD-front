import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { SharedService } from '../../../servicios/shared.service';
import { HumanResourcesService } from '../../../servicios/human-resources.service';
import Swal from 'sweetalert2';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  employee?: {
    id: number;
    employee_number?: string;
    hire_date?: string;
    job_position?: { name: string };
    department?: { name: string };
    area?: { name: string };
  };
  fiscal_data?: {
    rfc?: string;
    curp?: string;
    imss_number?: string;
    bank_name?: string;
    bank_account?: string;
    clabe?: string;
  };
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  private router = inject(Router);
  private sharedService = inject(SharedService);
  private hrService = inject(HumanResourcesService);
  private fb = inject(FormBuilder);

  profile: UserProfile | null = null;
  loading = true;
  activeTab = 'info';

  // Permisos
  canCreatePurchaseRequest = false;
  canRequestVacation = false;
  canRequestLeave = false;
  canRegisterDisability = false;
  canRegisterAttendance = false;

  // Formulario de datos fiscales
  fiscalForm!: FormGroup;
  savingFiscal = false;

  ngOnInit(): void {
    this.loadUserProfile();
    this.checkPermissions();
    this.initFiscalForm();
  }

  private initFiscalForm(): void {
    this.fiscalForm = this.fb.group({
      rfc: ['', [Validators.pattern(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/)]],
      curp: ['', [Validators.pattern(/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/)]],
      imss_number: [''],
      bank_name: [''],
      bank_account: [''],
      clabe: ['', [Validators.pattern(/^\d{18}$/)]]
    });
  }

  private loadUserProfile(): void {
    this.loading = true;

    // Obtener datos del usuario actual
    const userId = this.sharedService.getCurrentUserId();
    if (!userId) {
      Swal.fire('Error', 'No se pudo obtener el usuario actual', 'error');
      this.loading = false;
      return;
    }

    // Obtener perfil del usuario (incluye empleado si está vinculado)
    this.hrService.getUserProfile().subscribe({
      next: (response: any) => {
        this.profile = response.data;
        if (this.profile?.fiscal_data) {
          this.fiscalForm.patchValue(this.profile.fiscal_data);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading profile:', err);
        // Fallback: datos básicos del localStorage
        const userData = localStorage.getItem('user_permissions');
        if (userData) {
          const parsed = JSON.parse(userData);
          this.profile = {
            id: parsed.user?.id || 0,
            name: parsed.user?.name || 'Usuario',
            email: parsed.user?.email || ''
          };
        }
        this.loading = false;
      }
    });
  }

  private checkPermissions(): void {
    this.canCreatePurchaseRequest = this.sharedService.hasPermission('purchase-requests', '', 'create');
    this.canRequestVacation = this.sharedService.hasPermission('hr', 'vacations', 'request');
    this.canRequestLeave = this.sharedService.hasPermission('hr', 'leaves', 'request');
    this.canRegisterDisability = this.sharedService.hasPermission('hr', 'disabilities', 'create');
    this.canRegisterAttendance = true; // Todos pueden registrar asistencia
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  // Acciones rápidas
  requestVacation(): void {
    this.router.navigate(['/hr/vacations/request']);
  }

  requestLeave(): void {
    this.router.navigate(['/hr/leaves/request']);
  }

  registerDisability(): void {
    this.router.navigate(['/hr/disabilities/add']);
  }

  registerAttendance(): void {
    this.router.navigate(['/hr/attendance/check']);
  }

  createPurchaseRequest(): void {
    this.router.navigate(['/purchases/purchase-requests/add']);
  }

  // Guardar datos fiscales
  saveFiscalData(): void {
    if (this.fiscalForm.invalid) {
      Swal.fire('Error', 'Por favor corrija los errores en el formulario', 'error');
      return;
    }

    this.savingFiscal = true;
    const fiscalData = this.fiscalForm.value;

    this.hrService.updateFiscalData(fiscalData).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Datos guardados',
          text: 'Sus datos fiscales han sido actualizados',
          timer: 2000,
          showConfirmButton: false
        });
        this.savingFiscal = false;
        if (this.profile) {
          this.profile.fiscal_data = fiscalData;
        }
      },
      error: (err) => {
        Swal.fire('Error', err.error?.message || 'No se pudieron guardar los datos', 'error');
        this.savingFiscal = false;
      }
    });
  }

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
