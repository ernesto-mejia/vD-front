import { Routes } from '@angular/router';

export const hrRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  // Dashboard
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/hr-dashboard.component')
      .then(m => m.HrDashboardComponent),
    data: { title: 'Dashboard RRHH' }
  },
  // Perfil de Usuario
  {
    path: 'profile',
    loadComponent: () => import('./profile/user-profile.component')
      .then(m => m.UserProfileComponent),
    data: { title: 'Mi Perfil' }
  },
  // Estructura Organizacional
  {
    path: 'areas',
    loadComponent: () => import('./organizational-structure/areas-list.component')
      .then(m => m.AreasListComponent),
    data: { title: 'Áreas' }
  },
  {
    path: 'departments',
    loadComponent: () => import('./organizational-structure/departments-list.component')
      .then(m => m.DepartmentsListComponent),
    data: { title: 'Departamentos' }
  },
  {
    path: 'job-positions',
    loadComponent: () => import('./organizational-structure/job-positions-list.component')
      .then(m => m.JobPositionsListComponent),
    data: { title: 'Puestos de Trabajo' }
  },
  {
    path: 'user-links',
    loadComponent: () => import('./organizational-structure/user-employee-links.component')
      .then(m => m.UserEmployeeLinksComponent),
    data: { title: 'Vínculos Usuario-Empleado' }
  },
  {
    path: 'authorizers',
    loadComponent: () => import('./organizational-structure/authorizers-list.component')
      .then(m => m.AuthorizersListComponent),
    data: { title: 'Autorizadores de Compra' }
  },
  // Empleados
  {
    path: 'employees',
    loadComponent: () => import('./employees/employees-list.component')
      .then(m => m.EmployeesListComponent),
    data: { title: 'Empleados' }
  },
  {
    path: 'employees/new',
    loadComponent: () => import('./employees/employee-form.component')
      .then(m => m.EmployeeFormComponent),
    data: { title: 'Nuevo Empleado' }
  },
  {
    path: 'employees/fiscal-data',
    loadComponent: () => import('./employees/employee-fiscal-data.component')
      .then(m => m.EmployeeFiscalDataComponent),
    data: { title: 'Datos Fiscales del Empleado' }
  },
  {
    path: 'employees/:id',
    loadComponent: () => import('./employees/employee-form.component')
      .then(m => m.EmployeeFormComponent),
    data: { title: 'Editar Empleado' }
  },
  {
    path: 'employees/:id/fiscal-data',
    loadComponent: () => import('./employees/employee-fiscal-data.component')
      .then(m => m.EmployeeFiscalDataComponent),
    data: { title: 'Datos Fiscales del Empleado' }
  },
  // Contratos
  {
    path: 'contracts',
    loadComponent: () => import('./contracts/contracts-list.component')
      .then(m => m.ContractsListComponent),
    data: { title: 'Contratos Laborales' }
  },
  {
    path: 'contracts/new',
    loadComponent: () => import('./contracts/contract-form.component')
      .then(m => m.ContractFormComponent),
    data: { title: 'Nuevo Contrato' }
  },
  {
    path: 'contracts/:id',
    loadComponent: () => import('./contracts/contract-form.component')
      .then(m => m.ContractFormComponent),
    data: { title: 'Editar Contrato' }
  },
  // Vacaciones
  {
    path: 'vacations',
    loadComponent: () => import('./vacations/vacations-list.component')
      .then(m => m.VacationsListComponent),
    data: { title: 'Solicitudes de Vacaciones' }
  },
  {
    path: 'vacations/request',
    loadComponent: () => import('./vacations/vacation-request.component')
      .then(m => m.VacationRequestComponent),
    data: { title: 'Solicitar Vacaciones' }
  },
  {
    path: 'vacations/balances',
    loadComponent: () => import('./vacations/vacation-balances.component')
      .then(m => m.VacationBalancesComponent),
    data: { title: 'Saldos de Vacaciones' }
  },
  // Permisos
  {
    path: 'leaves',
    loadComponent: () => import('./leaves/leaves-list.component')
      .then(m => m.LeavesListComponent),
    data: { title: 'Permisos e Incidencias' }
  },
  {
    path: 'leaves/request',
    loadComponent: () => import('./leaves/leave-request.component')
      .then(m => m.LeaveRequestComponent),
    data: { title: 'Solicitar Permiso' }
  },
  // Asistencia
  {
    path: 'attendance',
    loadComponent: () => import('./attendance/attendance-list.component')
      .then(m => m.AttendanceListComponent),
    data: { title: 'Control de Asistencia' }
  },
  {
    path: 'attendance/check',
    loadComponent: () => import('./attendance/attendance-check.component')
      .then(m => m.AttendanceCheckComponent),
    data: { title: 'Registrar Asistencia' }
  },
  // Incapacidades
  {
    path: 'disabilities',
    loadComponent: () => import('./disabilities/disabilities-list.component')
      .then(m => m.DisabilitiesListComponent),
    data: { title: 'Incapacidades' }
  },
  {
    path: 'disabilities/new',
    loadComponent: () => import('./disabilities/disability-form.component')
      .then(m => m.DisabilityFormComponent),
    data: { title: 'Registrar Incapacidad' }
  },
  {
    path: 'disabilities/:id',
    loadComponent: () => import('./disabilities/disability-form.component')
      .then(m => m.DisabilityFormComponent),
    data: { title: 'Editar Incapacidad' }
  },
  // Nómina
  {
    path: 'payroll',
    loadComponent: () => import('./payroll/payroll-periods.component')
      .then(m => m.PayrollPeriodsComponent),
    data: { title: 'Períodos de Nómina' }
  },
  {
    path: 'payroll/:id',
    loadComponent: () => import('./payroll/payroll-detail.component')
      .then(m => m.PayrollDetailComponent),
    data: { title: 'Detalle de Nómina' }
  },
  // Préstamos
  {
    path: 'loans',
    loadComponent: () => import('./payroll/loans-list.component')
      .then(m => m.LoansListComponent),
    data: { title: 'Préstamos' }
  },
  // Calendario RRHH
  {
    path: 'calendar',
    loadComponent: () => import('./calendar/hr-calendar.component')
      .then(m => m.HrCalendarComponent),
    data: { title: 'Calendario RRHH' }
  },
  // Finiquitos
  {
    path: 'settlements',
    loadComponent: () => import('./settlements/settlements-list.component')
      .then(m => m.SettlementsListComponent),
    data: { title: 'Finiquitos y Liquidaciones' }
  }
];
