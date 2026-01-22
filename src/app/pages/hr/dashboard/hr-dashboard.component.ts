import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HumanResourcesService } from '../../../servicios/human-resources.service';
import { PayrollService } from '../../../servicios/payroll.service';
import { SidebarComponent } from '../../sidebar/sidebar.component';

@Component({
  selector: 'app-hr-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  template: `
    <app-sidebar></app-sidebar>
    <main class="main-content">
    <div class="container-fluid py-4">
      <div class="row mb-4">
        <div class="col-12">
          <h4><i class="fa fa-tachometer-alt me-2"></i>Dashboard de Recursos Humanos</h4>
        </div>
      </div>

      <!-- KPIs Principales -->
      <div class="row mb-4">
        <div class="col-md-3">
          <div class="card bg-primary text-white h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="text-white-50">Empleados Activos</h6>
                  <h2 class="mb-0">{{stats.totalEmployees}}</h2>
                </div>
                <i class="fa fa-users fa-2x opacity-50"></i>
              </div>
            </div>
            <div class="card-footer bg-transparent border-0">
              <small><i class="fa fa-arrow-up me-1"></i>{{stats.newThisMonth}} nuevos este mes</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-success text-white h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="text-white-50">Contratos Activos</h6>
                  <h2 class="mb-0">{{stats.activeContracts}}</h2>
                </div>
                <i class="fa fa-file-contract fa-2x opacity-50"></i>
              </div>
            </div>
            <div class="card-footer bg-transparent border-0">
              <small class="text-warning">
                <i class="fa fa-exclamation-triangle me-1"></i>{{stats.expiringContracts}} por vencer
              </small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-warning text-dark h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="opacity-75">Solicitudes Pendientes</h6>
                  <h2 class="mb-0">{{stats.pendingRequests}}</h2>
                </div>
                <i class="fa fa-clock fa-2x opacity-50"></i>
              </div>
            </div>
            <div class="card-footer bg-transparent border-0">
              <small>Vacaciones, permisos e incapacidades</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-info text-white h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="text-white-50">Nómina del Mes</h6>
                  <h2 class="mb-0">{{stats.monthlyPayroll | currency:'MXN':'symbol':'1.0-0'}}</h2>
                </div>
                <i class="fa fa-money-bill-wave fa-2x opacity-50"></i>
              </div>
            </div>
            <div class="card-footer bg-transparent border-0">
              <small>{{stats.payrollEmployees}} empleados</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Accesos Rápidos -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h6 class="mb-0"><i class="fa fa-bolt me-2"></i>Accesos Rápidos</h6>
            </div>
            <div class="card-body">
              <div class="row g-3">
                <div class="col-md-2 col-6">
                  <a routerLink="/hr/contracts/new" class="btn btn-outline-primary w-100 py-3">
                    <i class="fa fa-plus-circle d-block mb-2 fa-2x"></i>
                    Nuevo Contrato
                  </a>
                </div>
                <div class="col-md-2 col-6">
                  <a routerLink="/hr/vacations/request" class="btn btn-outline-success w-100 py-3">
                    <i class="fa fa-calendar-plus d-block mb-2 fa-2x"></i>
                    Solicitar Vacaciones
                  </a>
                </div>
                <div class="col-md-2 col-6">
                  <a routerLink="/hr/leaves/request" class="btn btn-outline-warning w-100 py-3">
                    <i class="fa fa-user-clock d-block mb-2 fa-2x"></i>
                    Solicitar Permiso
                  </a>
                </div>
                <div class="col-md-2 col-6">
                  <a routerLink="/hr/disabilities/new" class="btn btn-outline-danger w-100 py-3">
                    <i class="fa fa-hospital d-block mb-2 fa-2x"></i>
                    Registrar Incapacidad
                  </a>
                </div>
                <div class="col-md-2 col-6">
                  <a routerLink="/hr/attendance/check" class="btn btn-outline-info w-100 py-3">
                    <i class="fa fa-fingerprint d-block mb-2 fa-2x"></i>
                    Registrar Asistencia
                  </a>
                </div>
                <div class="col-md-2 col-6">
                  <a routerLink="/hr/employees/fiscal-data" class="btn btn-outline-secondary w-100 py-3">
                    <i class="fa fa-id-card d-block mb-2 fa-2x"></i>
                    Datos Fiscales
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <!-- Solicitudes Pendientes -->
        <div class="col-md-6">
          <div class="card mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h6 class="mb-0"><i class="fa fa-inbox me-2"></i>Solicitudes Pendientes</h6>
              <span class="badge bg-warning text-dark">{{pendingItems.length}}</span>
            </div>
            <div class="card-body p-0">
              <div class="list-group list-group-flush">
                <div *ngFor="let item of pendingItems.slice(0, 5)" class="list-group-item">
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <span class="badge me-2" [ngClass]="getTypeBadgeClass(item.type)">
                        {{item.type}}
                      </span>
                      <strong>{{item.employee_name}}</strong>
                      <br>
                      <small class="text-muted">{{item.description}}</small>
                    </div>
                    <div class="text-end">
                      <small class="text-muted d-block">{{item.date | date:'dd/MM'}}</small>
                      <a [routerLink]="item.link" class="btn btn-sm btn-outline-primary">
                        Revisar
                      </a>
                    </div>
                  </div>
                </div>
                <div *ngIf="pendingItems.length === 0" class="list-group-item text-center text-muted py-4">
                  No hay solicitudes pendientes
                </div>
              </div>
            </div>
            <div class="card-footer text-center" *ngIf="pendingItems.length > 5">
              <a routerLink="/hr/vacations" class="text-primary">Ver todas las solicitudes</a>
            </div>
          </div>
        </div>

        <!-- Contratos por Vencer -->
        <div class="col-md-6">
          <div class="card mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h6 class="mb-0"><i class="fa fa-exclamation-circle me-2"></i>Contratos por Vencer</h6>
              <span class="badge bg-danger">{{expiringContracts.length}}</span>
            </div>
            <div class="card-body p-0">
              <div class="list-group list-group-flush">
                <div *ngFor="let contract of expiringContracts.slice(0, 5)" class="list-group-item">
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{{contract.employee?.first_name}} {{contract.employee?.paternal_surname}}</strong>
                      <br>
                      <small class="text-muted">{{contract.contract_type}} - {{contract.department}}</small>
                    </div>
                    <div class="text-end">
                      <span class="badge" [ngClass]="getDaysLeftClass(contract.days_left)">
                        {{contract.days_left}} días
                      </span>
                      <br>
                      <small class="text-muted">{{contract.end_date | date:'dd/MM/yyyy'}}</small>
                    </div>
                  </div>
                </div>
                <div *ngIf="expiringContracts.length === 0" class="list-group-item text-center text-muted py-4">
                  No hay contratos próximos a vencer
                </div>
              </div>
            </div>
            <div class="card-footer text-center" *ngIf="expiringContracts.length > 5">
              <a routerLink="/hr/contracts" class="text-primary">Ver todos los contratos</a>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <!-- Incapacidades Activas -->
        <div class="col-md-6">
          <div class="card mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h6 class="mb-0"><i class="fa fa-hospital me-2"></i>Incapacidades Activas</h6>
              <span class="badge bg-info">{{activeDisabilities.length}}</span>
            </div>
            <div class="card-body p-0">
              <div class="list-group list-group-flush">
                <div *ngFor="let disability of activeDisabilities.slice(0, 5)" class="list-group-item">
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{{disability.employee?.first_name}} {{disability.employee?.paternal_surname}}</strong>
                      <br>
                      <small>
                        <span class="badge" [ngClass]="getDisabilityTypeClass(disability.disability_type)">
                          {{getDisabilityTypeLabel(disability.disability_type)}}
                        </span>
                      </small>
                    </div>
                    <div class="text-end">
                      <small class="text-muted">
                        {{disability.start_date | date:'dd/MM'}} - {{disability.end_date | date:'dd/MM'}}
                      </small>
                      <br>
                      <span class="badge bg-secondary">{{disability.total_days}} días</span>
                    </div>
                  </div>
                </div>
                <div *ngIf="activeDisabilities.length === 0" class="list-group-item text-center text-muted py-4">
                  No hay incapacidades activas
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Resumen de Asistencia de Hoy -->
        <div class="col-md-6">
          <div class="card mb-4">
            <div class="card-header">
              <h6 class="mb-0"><i class="fa fa-calendar-check me-2"></i>Asistencia de Hoy</h6>
            </div>
            <div class="card-body">
              <div class="row text-center">
                <div class="col-3">
                  <div class="border rounded py-3">
                    <h4 class="text-success mb-0">{{attendanceStats.present}}</h4>
                    <small class="text-muted">Presentes</small>
                  </div>
                </div>
                <div class="col-3">
                  <div class="border rounded py-3">
                    <h4 class="text-warning mb-0">{{attendanceStats.late}}</h4>
                    <small class="text-muted">Retardos</small>
                  </div>
                </div>
                <div class="col-3">
                  <div class="border rounded py-3">
                    <h4 class="text-danger mb-0">{{attendanceStats.absent}}</h4>
                    <small class="text-muted">Ausentes</small>
                  </div>
                </div>
                <div class="col-3">
                  <div class="border rounded py-3">
                    <h4 class="text-info mb-0">{{attendanceStats.vacation}}</h4>
                    <small class="text-muted">Vacaciones</small>
                  </div>
                </div>
              </div>
              <div class="progress mt-3" style="height: 25px;">
                <div class="progress-bar bg-success"
                  [style.width.%]="getAttendancePercentage('present')">
                  {{getAttendancePercentage('present')}}%
                </div>
                <div class="progress-bar bg-warning"
                  [style.width.%]="getAttendancePercentage('late')">
                </div>
                <div class="progress-bar bg-danger"
                  [style.width.%]="getAttendancePercentage('absent')">
                </div>
              </div>
            </div>
            <div class="card-footer text-center">
              <a routerLink="/hr/attendance" class="text-primary">Ver detalle de asistencia</a>
            </div>
          </div>
        </div>
      </div>

      <!-- Préstamos Activos -->
      <div class="row">
        <div class="col-12">
          <div class="card mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h6 class="mb-0"><i class="fa fa-hand-holding-usd me-2"></i>Préstamos Activos</h6>
              <a routerLink="/hr/loans" class="btn btn-sm btn-outline-primary">Ver todos</a>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>Empleado</th>
                      <th>Tipo</th>
                      <th class="text-end">Monto Original</th>
                      <th class="text-center">Progreso</th>
                      <th class="text-end">Saldo Pendiente</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let loan of activeLoans.slice(0, 5)">
                      <td>{{loan.employee?.first_name}} {{loan.employee?.paternal_surname}}</td>
                      <td>
                        <span class="badge" [ngClass]="getLoanTypeClass(loan.loan_type)">
                          {{getLoanTypeLabel(loan.loan_type)}}
                        </span>
                      </td>
                      <td class="text-end">{{loan.amount | currency:'MXN'}}</td>
                      <td class="text-center">
                        <div class="progress" style="height: 20px; min-width: 100px;">
                          <div class="progress-bar bg-success"
                            [style.width.%]="getLoanProgress(loan)">
                            {{loan.payments_made}}/{{loan.total_payments}}
                          </div>
                        </div>
                      </td>
                      <td class="text-end text-danger">{{loan.remaining_balance | currency:'MXN'}}</td>
                    </tr>
                    <tr *ngIf="activeLoans.length === 0">
                      <td colspan="5" class="text-center text-muted py-3">
                        No hay préstamos activos
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </main>
  `
})
export class HrDashboardComponent implements OnInit {
  stats = {
    totalEmployees: 0,
    newThisMonth: 0,
    activeContracts: 0,
    expiringContracts: 0,
    pendingRequests: 0,
    monthlyPayroll: 0,
    payrollEmployees: 0
  };

  attendanceStats = {
    present: 0,
    late: 0,
    absent: 0,
    vacation: 0
  };

  pendingItems: any[] = [];
  expiringContracts: any[] = [];
  activeDisabilities: any[] = [];
  activeLoans: any[] = [];

  constructor(
    private hrService: HumanResourcesService,
    private payrollService: PayrollService
  ) {}

  ngOnInit() {
    this.loadStats();
    this.loadPendingItems();
    this.loadExpiringContracts();
    this.loadActiveDisabilities();
    this.loadActiveLoans();
    this.loadAttendanceStats();
  }

  loadStats() {
    // Cargar estadísticas generales
    this.hrService.getContracts({ status: 'active' }).subscribe({
      next: (res) => {
        this.stats.activeContracts = res.data?.total || res.data?.length || 0;
      }
    });

    this.hrService.getExpiringContracts(30).subscribe({
      next: (res) => {
        this.stats.expiringContracts = res.data?.length || 0;
      }
    });

    // Contar solicitudes pendientes
    let pendingCount = 0;
    this.hrService.getPendingVacations().subscribe({
      next: (res) => {
        pendingCount += res.data?.length || 0;
        this.stats.pendingRequests = pendingCount;
      }
    });
    this.hrService.getPendingLeaves().subscribe({
      next: (res) => {
        pendingCount += res.data?.length || 0;
        this.stats.pendingRequests = pendingCount;
      }
    });
  }

  loadPendingItems() {
    const items: any[] = [];

    this.hrService.getPendingVacations().subscribe({
      next: (res) => {
        const vacations = res.data || [];
        vacations.forEach((v: any) => {
          items.push({
            type: 'Vacaciones',
            employee_name: `${v.employee?.first_name} ${v.employee?.paternal_surname}`,
            description: `${v.days_requested} días - ${v.start_date}`,
            date: v.created_at,
            link: '/hr/vacations'
          });
        });
        this.pendingItems = items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
    });

    this.hrService.getPendingLeaves().subscribe({
      next: (res) => {
        const leaves = res.data || [];
        leaves.forEach((l: any) => {
          items.push({
            type: 'Permiso',
            employee_name: `${l.employee?.first_name} ${l.employee?.paternal_surname}`,
            description: l.leave_type?.name || 'Permiso',
            date: l.created_at,
            link: '/hr/leaves'
          });
        });
        this.pendingItems = items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
    });
  }

  loadExpiringContracts() {
    this.hrService.getExpiringContracts(30).subscribe({
      next: (res) => {
        this.expiringContracts = (res.data || []).map((c: any) => ({
          ...c,
          days_left: Math.ceil((new Date(c.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        }));
      }
    });
  }

  loadActiveDisabilities() {
    this.hrService.getActiveDisabilities().subscribe({
      next: (res) => this.activeDisabilities = res.data || []
    });
  }

  loadActiveLoans() {
    this.payrollService.getActiveLoans().subscribe({
      next: (res) => this.activeLoans = res.data?.data || res.data || []
    });
  }

  loadAttendanceStats() {
    this.hrService.getTodayAttendance().subscribe({
      next: (res) => {
        const records = res.data || [];
        this.attendanceStats.present = records.filter((r: any) => r.status === 'complete').length;
        this.attendanceStats.late = records.filter((r: any) => r.status === 'late').length;
        this.attendanceStats.absent = records.filter((r: any) => r.status === 'absent').length;
        this.attendanceStats.vacation = records.filter((r: any) => r.status === 'vacation').length;
      }
    });
  }

  getAttendancePercentage(type: string): number {
    const total = this.attendanceStats.present + this.attendanceStats.late +
                  this.attendanceStats.absent + this.attendanceStats.vacation;
    if (total === 0) return 0;
    return Math.round(((this.attendanceStats as any)[type] / total) * 100);
  }

  getTypeBadgeClass(type: string): string {
    const classes: { [key: string]: string } = {
      'Vacaciones': 'bg-success',
      'Permiso': 'bg-warning text-dark',
      'Incapacidad': 'bg-danger'
    };
    return classes[type] || 'bg-secondary';
  }

  getDaysLeftClass(days: number): string {
    if (days <= 7) return 'bg-danger';
    if (days <= 15) return 'bg-warning text-dark';
    return 'bg-info';
  }

  getDisabilityTypeClass(type: string): string {
    const classes: { [key: string]: string } = {
      'general_illness': 'bg-warning text-dark',
      'work_risk': 'bg-danger',
      'maternity': 'bg-info'
    };
    return classes[type] || 'bg-secondary';
  }

  getDisabilityTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'general_illness': 'Enfermedad General',
      'work_risk': 'Riesgo de Trabajo',
      'maternity': 'Maternidad'
    };
    return labels[type] || type;
  }

  getLoanTypeClass(type: string): string {
    const classes: { [key: string]: string } = {
      'personal': 'bg-primary',
      'fonacot': 'bg-info',
      'infonavit': 'bg-warning text-dark',
      'emergency': 'bg-danger',
      'advance': 'bg-secondary'
    };
    return classes[type] || 'bg-secondary';
  }

  getLoanTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'personal': 'Personal',
      'fonacot': 'FONACOT',
      'infonavit': 'INFONAVIT',
      'emergency': 'Emergencia',
      'advance': 'Adelanto'
    };
    return labels[type] || type;
  }

  getLoanProgress(loan: any): number {
    if (!loan.total_payments) return 0;
    return ((loan.payments_made || 0) / loan.total_payments) * 100;
  }
}
