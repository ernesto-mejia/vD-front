import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiEndpoint } from '../shared/api-endpoint.util';

export interface PayrollPeriod {
  id?: number;
  company_id?: number;
  period_type: string;
  year: number;
  period_number: number;
  period_name?: string;
  start_date: string;
  end_date: string;
  payment_date: string;
  is_extraordinary: boolean;
  description?: string;
  status: string;
  total_employees?: number;
  employee_count?: number;
  total_perceptions?: number;
  total_deductions?: number;
  total_net?: number;
  total_gross?: number;
  total_isr?: number;
  calculated_at?: string;
  approved_at?: string;
  paid_at?: string;
}

export interface PayrollReceipt {
  id?: number;
  payroll_period_id: number;
  employee_id: number;
  receipt_number?: string;
  employee_name?: string;
  employee_number?: string;
  department?: string;
  job_position?: string;
  curp?: string;
  rfc?: string;
  nss?: string;
  payment_method?: string;
  bank_name?: string;
  bank_account?: string;
  clabe?: string;
  days_worked?: number;
  days_paid?: number;
  base_salary_daily?: number;
  daily_salary?: number;
  integrated_daily_wage?: number;
  total_perceptions?: number;
  total_taxable_perceptions?: number;
  total_exempt_perceptions?: number;
  total_deductions?: number;
  total_other_payments?: number;
  total_earnings?: number;
  isr_withheld?: number;
  isr_amount?: number;
  infonavit_amount?: number;
  employment_subsidy?: number;
  employment_subsidy_delivered?: number;
  imss_employee?: number;
  net_payment?: number;
  net_pay?: number;
  status: string;
  cfdi_uuid?: string;
  employee?: any;
  payroll_period?: any;
  perceptions?: any[];
  deductions?: any[];
  earnings_detail?: any[];
  deductions_detail?: any[];
}

export interface EmployeeLoan {
  id?: number;
  employee_id: number;
  loan_number?: string;
  loan_type: string;
  description?: string;
  original_amount: number;
  amount?: number;
  interest_rate?: number;
  total_amount?: number;
  paid_amount?: number;
  remaining_amount?: number;
  remaining_balance?: number;
  installment_amount?: number;
  payment_amount?: number;
  installments_total: number;
  installments_paid?: number;
  installments_remaining?: number;
  total_payments?: number;
  payments_made?: number;
  start_date: string;
  end_date?: string;
  deduction_type: string;
  fonacot_credit_number?: string;
  infonavit_credit_number?: string;
  status: string;
  approved_at?: string;
  notes?: string;
  employee?: any;
  payments?: any[];
}

// Alias para compatibilidad
export type Loan = EmployeeLoan;

export interface LoanPayment {
  id?: number;
  employee_loan_id: number;
  payroll_receipt_id?: number;
  payment_number: number;
  amount: number;
  balance_before: number;
  balance_after: number;
  payment_date: string;
  payment_method?: string;
  reference?: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PayrollService {
  private get apiUrl(): string {
    return apiEndpoint('payroll');
  }

  constructor(private http: HttpClient) {}

  // ===================== PERÍODOS DE NÓMINA =====================
  getPeriods(filters?: { year?: number; period_type?: string; status?: string }): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if ((filters as any)[key]) params = params.set(key, (filters as any)[key]);
      });
    }
    return this.http.get(`${this.apiUrl}/periods`, { params });
  }

  getPeriod(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/periods/${id}`);
  }

  createPeriod(period: PayrollPeriod): Observable<any> {
    return this.http.post(`${this.apiUrl}/periods`, period);
  }

  calculatePeriod(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/periods/${id}/calculate`, {});
  }

  recalculateEmployee(periodId: number, employeeId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/periods/${periodId}/recalculate/${employeeId}`, {});
  }

  approvePeriod(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/periods/${id}/approve`, {});
  }

  markAsPaid(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/periods/${id}/pay`, {});
  }

  cancelPeriod(id: number, data: { cancellation_reason: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/periods/${id}/cancel`, data);
  }

  getPeriodSummary(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/periods/${id}/summary`);
  }

  getBankLayout(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/periods/${id}/bank-layout`);
  }

  // ===================== RECIBOS =====================
  getPeriodReceipts(periodId: number, filters?: { search?: string; per_page?: number }): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if ((filters as any)[key]) params = params.set(key, (filters as any)[key]);
      });
    }
    return this.http.get(`${this.apiUrl}/receipts/period/${periodId}`, { params });
  }

  getReceipt(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/receipts/${id}`);
  }

  downloadReceipt(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/receipts/${id}/download`, { responseType: 'blob' });
  }

  getEmployeeReceipts(employeeId: number, filters?: { year?: number }): Observable<any> {
    let params = new HttpParams();
    if (filters?.year) params = params.set('year', filters.year.toString());
    return this.http.get(`${this.apiUrl}/employee/${employeeId}/receipts`, { params });
  }

  getEmployeeAccumulated(employeeId: number, year?: number): Observable<any> {
    let params = new HttpParams();
    if (year) params = params.set('year', year.toString());
    return this.http.get(`${this.apiUrl}/employee/${employeeId}/accumulated`, { params });
  }

  // ===================== PRÉSTAMOS =====================
  getLoans(filters?: { employee_id?: number; status?: string; loan_type?: string }): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if ((filters as any)[key]) params = params.set(key, (filters as any)[key]);
      });
    }
    return this.http.get(`${this.apiUrl}/loans`, { params });
  }

  getPendingLoans(): Observable<any> {
    return this.http.get(`${this.apiUrl}/loans/pending`);
  }

  getLoan(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/loans/${id}`);
  }

  createLoan(loan: EmployeeLoan): Observable<any> {
    return this.http.post(`${this.apiUrl}/loans`, loan);
  }

  updateLoan(id: number, loan: Partial<EmployeeLoan>): Observable<any> {
    return this.http.put(`${this.apiUrl}/loans/${id}`, loan);
  }

  approveLoan(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/loans/${id}/approve`, {});
  }

  rejectLoan(id: number, data: { rejection_reason: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/loans/${id}/reject`, data);
  }

  pauseLoan(id: number, data: { pause_reason: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/loans/${id}/pause`, data);
  }

  reactivateLoan(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/loans/${id}/reactivate`, {});
  }

  registerLoanPayment(id: number, data: { amount: number; payment_method?: string; reference?: string; notes?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/loans/${id}/payment`, data);
  }

  getLoanPayments(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/loans/${id}/payments`);
  }

  getEmployeeLoans(employeeId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/employee/${employeeId}/loans`);
  }

  getLoanCatalogs(): Observable<any> {
    return this.http.get(`${this.apiUrl}/loans/catalogs`);
  }

  // ===================== MÉTODOS ADICIONALES =====================
  getPayrollPeriods(filters?: any): Observable<any> {
    return this.getPeriods(filters);
  }

  getPayrollPeriod(id: number): Observable<any> {
    return this.getPeriod(id);
  }

  createPayrollPeriod(period: PayrollPeriod): Observable<any> {
    return this.createPeriod(period);
  }

  calculatePayroll(id: number): Observable<any> {
    return this.calculatePeriod(id);
  }

  approvePayroll(id: number): Observable<any> {
    return this.approvePeriod(id);
  }

  markPayrollPaid(id: number, data?: { payment_date?: string }): Observable<any> {
    return this.markAsPaid(id);
  }

  getActiveLoans(): Observable<any> {
    return this.getLoans({ status: 'active' });
  }

  getEmployees(filters?: any): Observable<any> {
    // Redirige al servicio de HR para obtener empleados
    return this.http.get(apiEndpoint('hr/employees'), { params: filters });
  }

  emailReceipt(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/receipts/${id}/email`, {});
  }
}
