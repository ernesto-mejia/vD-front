import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiEndpoint } from '../shared/api-endpoint.util';

export interface EmploymentContract {
  id?: number;
  employee_id: number;
  contract_number?: string;
  contract_type: string;
  work_regime: string;
  working_day_type: string;
  payment_periodicity: string;
  start_date: string;
  end_date?: string;
  base_salary_daily: number;
  base_salary_monthly?: number;
  integrated_daily_wage?: number;
  department?: string;
  job_position?: string;
  work_location?: string;
  work_schedule?: string;
  trial_period_days?: number;
  training_period_days?: number;
  status: string;
  employee?: any;
}

export interface VacationRequest {
  id?: number;
  employee_id: number;
  vacation_balance_id?: number;
  start_date: string;
  end_date: string;
  days_requested: number;
  days_approved?: number;
  reason?: string;
  status: string;
  employee?: any;
}

export interface VacationBalance {
  id?: number;
  employee_id: number;
  year: number;
  anniversary_date?: string;
  seniority_years: number;
  entitled_days: number;
  accrued_days: number;
  used_days: number;
  pending_days: number;
  expired_days: number;
  status: string;
}

export interface LeaveRequest {
  id?: number;
  employee_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  total_hours?: number;
  is_paid: boolean;
  reason?: string;
  status: string;
  employee?: any;
  leave_type?: any;
}

export interface LeaveType {
  id?: number;
  code: string;
  name: string;
  description?: string;
  default_paid: boolean;
  requires_evidence: boolean;
  max_days_per_year?: number;
  is_active: boolean;
}

export interface AttendanceRecord {
  id?: number;
  employee_id: number;
  date: string;
  check_in?: string;
  check_out?: string;
  scheduled_check_in?: string;
  scheduled_check_out?: string;
  late_minutes?: number;
  early_departure_minutes?: number;
  overtime_minutes?: number;
  worked_hours?: number;
  status: string;
  is_holiday: boolean;
  is_rest_day: boolean;
  notes?: string;
  employee?: any;
}

export interface AttendanceIncident {
  id?: number;
  attendance_record_id?: number;
  employee_id: number;
  incident_type: string;
  incident_date: string;
  minutes_affected: number;
  is_justified: boolean;
  justification?: string;
  apply_deduction: boolean;
  deduction_amount?: number;
  status: string;
}

export interface WorkSchedule {
  id?: number;
  name: string;
  description?: string;
  monday_check_in?: string;
  monday_check_out?: string;
  tuesday_check_in?: string;
  tuesday_check_out?: string;
  wednesday_check_in?: string;
  wednesday_check_out?: string;
  thursday_check_in?: string;
  thursday_check_out?: string;
  friday_check_in?: string;
  friday_check_out?: string;
  saturday_check_in?: string;
  saturday_check_out?: string;
  sunday_check_in?: string;
  sunday_check_out?: string;
  weekly_hours: number;
  tolerance_minutes: number;
  is_active: boolean;
}

export interface DisabilityRecord {
  id?: number;
  employee_id: number;
  disability_type: string;
  imss_folio?: string;
  start_date: string;
  end_date: string;
  total_days: number;
  diagnosis?: string;
  diagnosis_code?: string;
  medical_unit?: string;
  doctor_name?: string;
  doctor_license?: string;
  branch_risk?: string;
  percentage_payable: number;
  daily_subsidy?: number;
  daily_wage?: number;
  total_subsidy?: number;
  is_work_related: boolean;
  work_incident_date?: string;
  work_incident_description?: string;
  status: string;
  document_path?: string;
  document_received?: boolean;
  notes?: string;
  employee?: any;
}

@Injectable({
  providedIn: 'root'
})
export class HumanResourcesService {
  private get apiUrl(): string {
    return apiEndpoint('hr');
  }

  constructor(private http: HttpClient) {}

  // ===================== CONTRATOS =====================
  getContracts(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get(`${this.apiUrl}/contracts`, { params });
  }

  getContract(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/contracts/${id}`);
  }

  createContract(contract: EmploymentContract): Observable<any> {
    return this.http.post(`${this.apiUrl}/contracts`, contract);
  }

  updateContract(id: number, contract: Partial<EmploymentContract>): Observable<any> {
    return this.http.put(`${this.apiUrl}/contracts/${id}`, contract);
  }

  approveContract(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/contracts/${id}/approve`, {});
  }

  terminateContract(id: number, data: { termination_date: string; termination_reason: string; settlement_amount?: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/contracts/${id}/terminate`, data);
  }

  renewContract(id: number, data: { new_end_date?: string; salary_increase_percentage?: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/contracts/${id}/renew`, data);
  }

  getExpiringContracts(days: number = 30): Observable<any> {
    return this.http.get(`${this.apiUrl}/contracts/expiring`, { params: { days_ahead: days.toString() } });
  }

  getContractCatalogs(): Observable<any> {
    return this.http.get(`${this.apiUrl}/contracts/catalogs`);
  }

  // ===================== VACACIONES =====================
  getVacationRequests(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) params = params.set(key, filters[key]);
      });
    }
    return this.http.get(`${this.apiUrl}/vacations`, { params });
  }

  getPendingVacations(): Observable<any> {
    return this.http.get(`${this.apiUrl}/vacations/pending`);
  }

  getVacationRequest(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/vacations/${id}`);
  }

  createVacationRequest(request: VacationRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/vacations`, request);
  }

  approveVacation(id: number, data?: { days_approved?: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/vacations/${id}/approve`, data || {});
  }

  hrApproveVacation(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/vacations/${id}/hr-approve`, {});
  }

  rejectVacation(id: number, data: { rejection_reason: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/vacations/${id}/reject`, data);
  }

  cancelVacation(id: number, data?: { cancellation_reason?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/vacations/${id}/cancel`, data || {});
  }

  getVacationBalance(employeeId: number, year?: number): Observable<any> {
    let params = new HttpParams();
    if (year) params = params.set('year', year.toString());
    return this.http.get(`${this.apiUrl}/vacation-balances/employee/${employeeId}`, { params });
  }

  getVacationBalanceHistory(employeeId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/vacation-balances/employee/${employeeId}/history`);
  }

  adjustVacationBalance(employeeId: number, data: { adjustment_days: number; adjustment_type: string; reason: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/vacation-balances/employee/${employeeId}/adjust`, data);
  }

  getVacationCalendar(filters?: { year?: number; month?: number; department_id?: number }): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if ((filters as any)[key]) params = params.set(key, (filters as any)[key]);
      });
    }
    return this.http.get(`${this.apiUrl}/vacations/calendar`, { params });
  }

  // ===================== PERMISOS/INCIDENCIAS =====================
  getLeaveTypes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/leaves/types`);
  }

  getLeaveRequests(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) params = params.set(key, filters[key]);
      });
    }
    return this.http.get(`${this.apiUrl}/leaves`, { params });
  }

  getPendingLeaves(): Observable<any> {
    return this.http.get(`${this.apiUrl}/leaves/pending`);
  }

  getLeaveRequest(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/leaves/${id}`);
  }

  createLeaveRequest(request: LeaveRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/leaves`, request);
  }

  approveLeave(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/leaves/${id}/approve`, {});
  }

  rejectLeave(id: number, data: { rejection_reason: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/leaves/${id}/reject`, data);
  }

  cancelLeave(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/leaves/${id}/cancel`, {});
  }

  getEmployeeLeaveSummary(employeeId: number, year?: number): Observable<any> {
    let params = new HttpParams();
    if (year) params = params.set('year', year.toString());
    return this.http.get(`${this.apiUrl}/leaves/employee/${employeeId}/summary`, { params });
  }

  createLeaveType(type: LeaveType): Observable<any> {
    return this.http.post(`${this.apiUrl}/leave-types`, type);
  }

  updateLeaveType(id: number, type: Partial<LeaveType>): Observable<any> {
    return this.http.put(`${this.apiUrl}/leave-types/${id}`, type);
  }

  // ===================== ASISTENCIA =====================
  getAttendanceRecords(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) params = params.set(key, filters[key]);
      });
    }
    return this.http.get(`${this.apiUrl}/attendance`, { params });
  }

  getTodayAttendance(): Observable<any> {
    return this.http.get(`${this.apiUrl}/attendance/today`);
  }

  checkIn(data?: { notes?: string; photo?: string | null; latitude?: number; longitude?: number; work_location_id?: number | null }): Observable<any> {
    return this.http.post(`${this.apiUrl}/attendance/check-in`, data || {});
  }

  checkOut(data?: { notes?: string; photo?: string | null; latitude?: number; longitude?: number; work_location_id?: number | null }): Observable<any> {
    return this.http.post(`${this.apiUrl}/attendance/check-out`, data || {});
  }

  getWorkLocations(): Observable<any> {
    return this.http.get(`${this.apiUrl}/work-locations`);
  }

  registerAttendance(record: AttendanceRecord): Observable<any> {
    return this.http.post(`${this.apiUrl}/attendance`, record);
  }

  updateAttendance(id: number, record: Partial<AttendanceRecord>): Observable<any> {
    return this.http.put(`${this.apiUrl}/attendance/${id}`, record);
  }

  getAttendanceReport(filters: { start_date: string; end_date: string; employee_id?: number; department_id?: number }): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      if ((filters as any)[key]) params = params.set(key, (filters as any)[key]);
    });
    return this.http.get(`${this.apiUrl}/attendance/report`, { params });
  }

  getAttendanceIncidents(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) params = params.set(key, filters[key]);
      });
    }
    return this.http.get(`${this.apiUrl}/attendance/incidents`, { params });
  }

  justifyIncident(id: number, data: { justification: string; evidence_path?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/attendance/incidents/${id}/justify`, data);
  }

  applyDeduction(id: number, data: { deduction_amount: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/attendance/incidents/${id}/apply-deduction`, data);
  }

  getWorkSchedules(): Observable<any> {
    return this.http.get(`${this.apiUrl}/work-schedules`);
  }

  createWorkSchedule(schedule: WorkSchedule): Observable<any> {
    return this.http.post(`${this.apiUrl}/work-schedules`, schedule);
  }

  // ===================== INCAPACIDADES =====================
  getDisabilities(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) params = params.set(key, filters[key]);
      });
    }
    return this.http.get(`${this.apiUrl}/disabilities`, { params });
  }

  getActiveDisabilities(): Observable<any> {
    return this.http.get(`${this.apiUrl}/disabilities/active`);
  }

  getDisability(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/disabilities/${id}`);
  }

  createDisability(record: DisabilityRecord): Observable<any> {
    return this.http.post(`${this.apiUrl}/disabilities`, record);
  }

  updateDisability(id: number, record: Partial<DisabilityRecord>): Observable<any> {
    return this.http.put(`${this.apiUrl}/disabilities/${id}`, record);
  }

  extendDisability(id: number, data: { new_end_date: string; extension_folio?: string; notes?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/disabilities/${id}/extend`, data);
  }

  completeDisability(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/disabilities/${id}/complete`, {});
  }

  cancelDisability(id: number, data: { cancellation_reason: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/disabilities/${id}/cancel`, data);
  }

  getDisabilityReport(filters: { start_date: string; end_date: string; department_id?: number }): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      if ((filters as any)[key]) params = params.set(key, (filters as any)[key]);
    });
    return this.http.get(`${this.apiUrl}/disabilities/report`, { params });
  }

  getDisabilityCatalogs(): Observable<any> {
    return this.http.get(`${this.apiUrl}/disabilities/catalogs`);
  }

  // ===================== EMPLEADOS =====================
  getEmployees(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) params = params.set(key, filters[key]);
      });
    }
    return this.http.get(`${this.apiUrl}/employees`, { params });
  }

  getEmployee(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/employees/${id}`);
  }

  createEmployee(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/employees`, data);
  }

  updateEmployee(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/employees/${id}`, data);
  }

  updateEmployeeFiscalData(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/employees/${id}/fiscal-data`, data);
  }

  terminateEmployee(id: number, data: { termination_date: string; termination_reason: string; notes?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/employees/${id}/terminate`, data);
  }

  reactivateEmployee(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/employees/${id}/reactivate`, {});
  }

  getEmployeeStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/employees/stats`);
  }

  uploadEmployeeDocument(employeeId: number, formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/employees/${employeeId}/documents`, formData);
  }

  downloadEmployeeDocument(employeeId: number, documentId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/employees/${employeeId}/documents/${documentId}`, { responseType: 'blob' });
  }

  // ===================== CALENDARIO RRHH =====================
  getCalendarEvents(filters: { start_date: string; end_date: string; types?: string[] }): Observable<any> {
    let params = new HttpParams()
      .set('start_date', filters.start_date)
      .set('end_date', filters.end_date);
    if (filters.types && filters.types.length > 0) {
      params = params.set('types', filters.types.join(','));
    }
    return this.http.get(`${this.apiUrl}/calendar/events`, { params });
  }

  getUpcomingBirthdays(days?: number): Observable<any> {
    let params = new HttpParams();
    if (days) params = params.set('days', days.toString());
    return this.http.get(`${this.apiUrl}/calendar/birthdays`, { params });
  }

  getUpcomingAnniversaries(days?: number): Observable<any> {
    let params = new HttpParams();
    if (days) params = params.set('days', days.toString());
    return this.http.get(`${this.apiUrl}/calendar/anniversaries`, { params });
  }

  // ===================== FINIQUITOS =====================
  getSettlements(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) params = params.set(key, filters[key]);
      });
    }
    return this.http.get(`${this.apiUrl}/settlements`, { params });
  }

  getSettlement(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/settlements/${id}`);
  }

  calculateSettlement(employeeId: number, data: { termination_date: string; termination_type: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/settlements/calculate`, { employee_id: employeeId, ...data });
  }

  createSettlement(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/settlements`, data);
  }

  updateSettlement(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/settlements/${id}`, data);
  }

  approveSettlement(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/settlements/${id}/approve`, {});
  }

  markSettlementPaid(id: number, data: { payment_date: string; payment_reference?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/settlements/${id}/mark-paid`, data);
  }

  // ===================== ESTRUCTURA ORGANIZACIONAL =====================
  getAreas(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) params = params.set(key, filters[key]);
      });
    }
    return this.http.get(`${this.apiUrl}/areas`, { params });
  }

  getArea(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/areas/${id}`);
  }

  createArea(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/areas`, data);
  }

  updateArea(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/areas/${id}`, data);
  }

  deleteArea(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/areas/${id}`);
  }

  getDepartments(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) params = params.set(key, filters[key]);
      });
    }
    return this.http.get(`${this.apiUrl}/departments`, { params });
  }

  getDepartment(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/departments/${id}`);
  }

  createDepartment(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/departments`, data);
  }

  updateDepartment(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/departments/${id}`, data);
  }

  deleteDepartment(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/departments/${id}`);
  }

  getJobPositions(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) params = params.set(key, filters[key]);
      });
    }
    return this.http.get(`${this.apiUrl}/job-positions`, { params });
  }

  getJobPosition(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/job-positions/${id}`);
  }

  createJobPosition(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/job-positions`, data);
  }

  updateJobPosition(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/job-positions/${id}`, data);
  }

  deleteJobPosition(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/job-positions/${id}`);
  }

  // ===================== PERFIL DE USUARIO =====================
  getUserProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`);
  }

  updateFiscalData(fiscalData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile/fiscal-data`, fiscalData);
  }
}
