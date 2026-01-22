import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HumanResourcesService } from '../../../servicios/human-resources.service';
import { SidebarComponent } from '../../sidebar/sidebar.component';

interface EmployeeFiscalData {
  id?: number;
  employee_number?: string;
  first_name?: string;
  paternal_surname?: string;
  maternal_surname?: string;

  // Datos fiscales SAT
  rfc?: string;
  curp?: string;
  nss?: string;
  tax_regime?: string;

  // Dirección
  street?: string;
  exterior_number?: string;
  interior_number?: string;
  neighborhood?: string;
  municipality?: string;
  state?: string;
  postal_code?: string;
  country?: string;

  // Datos bancarios
  bank_name?: string;
  bank_account?: string;
  clabe?: string;
  bank_account_type?: string;

  // Documentos
  ine_number?: string;
  ine_expiration?: string;
  passport_number?: string;
  passport_expiration?: string;

  // INFONAVIT
  infonavit_credit_number?: string;
  infonavit_discount_type?: string;
  infonavit_discount_value?: number;

  // FONACOT
  fonacot_credit_number?: string;
  fonacot_discount_amount?: number;

  // Documentos adjuntos
  documents?: any[];
}

@Component({
  selector: 'app-employee-fiscal-data',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  template: `
    <app-sidebar></app-sidebar>
    <main class="main-content">
    <div class="container-fluid">
      <div class="row mb-3">
        <div class="col-12">
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
              <li class="breadcrumb-item"><a routerLink="/hr">RRHH</a></li>
              <li class="breadcrumb-item active">Datos Fiscales del Empleado</li>
            </ol>
          </nav>
        </div>
      </div>

      <!-- Búsqueda de empleado -->
      <div class="card mb-3" *ngIf="!employee">
        <div class="card-header">
          <h5 class="mb-0"><i class="fa fa-search me-2"></i>Buscar Empleado</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <label class="form-label">Seleccionar Empleado</label>
              <select class="form-select" [(ngModel)]="selectedEmployeeId" (change)="loadEmployee()">
                <option value="">Seleccionar...</option>
                <option *ngFor="let emp of employees" [value]="emp.id">
                  {{emp.employee_number}} - {{emp.first_name}} {{emp.paternal_surname}}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Datos del empleado -->
      <div *ngIf="employee">
        <!-- Encabezado -->
        <div class="card mb-3">
          <div class="card-body d-flex justify-content-between align-items-center">
            <div>
              <h4 class="mb-0">
                {{employee.first_name}} {{employee.paternal_surname}} {{employee.maternal_surname}}
              </h4>
              <span class="text-muted">{{employee.employee_number}}</span>
            </div>
            <button class="btn btn-outline-secondary" (click)="clearEmployee()">
              <i class="fa fa-times me-1"></i> Cambiar Empleado
            </button>
          </div>
        </div>

        <!-- Tabs -->
        <ul class="nav nav-tabs mb-3">
          <li class="nav-item">
            <a class="nav-link" [class.active]="activeTab === 'fiscal'" (click)="activeTab = 'fiscal'">
              <i class="fa fa-file-invoice me-1"></i> Datos Fiscales
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" [class.active]="activeTab === 'address'" (click)="activeTab = 'address'">
              <i class="fa fa-map-marker-alt me-1"></i> Dirección
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" [class.active]="activeTab === 'bank'" (click)="activeTab = 'bank'">
              <i class="fa fa-university me-1"></i> Datos Bancarios
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" [class.active]="activeTab === 'documents'" (click)="activeTab = 'documents'">
              <i class="fa fa-id-card me-1"></i> Documentos
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" [class.active]="activeTab === 'credits'" (click)="activeTab = 'credits'">
              <i class="fa fa-credit-card me-1"></i> Créditos
            </a>
          </li>
        </ul>

        <form (ngSubmit)="save()">
          <!-- Tab: Datos Fiscales -->
          <div class="card mb-3" *ngIf="activeTab === 'fiscal'">
            <div class="card-header">
              <h5 class="mb-0"><i class="fa fa-file-invoice me-2"></i>Datos Fiscales SAT</h5>
            </div>
            <div class="card-body">
              <div class="row mb-3">
                <div class="col-md-4">
                  <label class="form-label">RFC <span class="text-danger">*</span></label>
                  <input type="text" class="form-control text-uppercase" [(ngModel)]="employee.rfc"
                    name="rfc" maxlength="13" placeholder="XAXX010101000"
                    pattern="^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$">
                  <small class="text-muted">13 caracteres para personas físicas</small>
                </div>
                <div class="col-md-4">
                  <label class="form-label">CURP <span class="text-danger">*</span></label>
                  <input type="text" class="form-control text-uppercase" [(ngModel)]="employee.curp"
                    name="curp" maxlength="18" placeholder="XEXX010101HNEXXXA4"
                    pattern="^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[A-Z0-9]{2}$">
                  <small class="text-muted">18 caracteres</small>
                </div>
                <div class="col-md-4">
                  <label class="form-label">NSS (Número de Seguro Social) <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" [(ngModel)]="employee.nss"
                    name="nss" maxlength="11" placeholder="12345678901"
                    pattern="^[0-9]{11}$">
                  <small class="text-muted">11 dígitos</small>
                </div>
              </div>
              <div class="row mb-3">
                <div class="col-md-6">
                  <label class="form-label">Régimen Fiscal SAT</label>
                  <select class="form-select" [(ngModel)]="employee.tax_regime" name="tax_regime">
                    <option value="">Seleccionar...</option>
                    <option value="02">02 - Sueldos y Salarios</option>
                    <option value="03">03 - Jubilados</option>
                    <option value="04">04 - Pensionados</option>
                    <option value="05">05 - Asimilados a Salarios Miembros de Sociedades</option>
                    <option value="06">06 - Asimilados a Salarios Honorarios</option>
                    <option value="07">07 - Asimilados a Salarios Comisionistas</option>
                    <option value="08">08 - Asimilados a Salarios Otros</option>
                    <option value="09">09 - Asimilados a Salarios Administradores</option>
                    <option value="10">10 - Asimilados a Salarios Acciones</option>
                    <option value="11">11 - Asimilados a Salarios Indemnización</option>
                    <option value="12">12 - Jubilados o Pensionados</option>
                    <option value="13">13 - Indemnización o Separación</option>
                    <option value="99">99 - Otro Régimen</option>
                  </select>
                </div>
              </div>

              <div class="alert alert-info">
                <i class="fa fa-info-circle me-2"></i>
                <strong>Validación SAT:</strong> Los datos fiscales deben coincidir con los registrados ante el SAT
                para la correcta emisión del CFDI de nómina.
              </div>
            </div>
          </div>

          <!-- Tab: Dirección -->
          <div class="card mb-3" *ngIf="activeTab === 'address'">
            <div class="card-header">
              <h5 class="mb-0"><i class="fa fa-map-marker-alt me-2"></i>Dirección Fiscal</h5>
            </div>
            <div class="card-body">
              <div class="row mb-3">
                <div class="col-md-6">
                  <label class="form-label">Calle</label>
                  <input type="text" class="form-control" [(ngModel)]="employee.street" name="street">
                </div>
                <div class="col-md-3">
                  <label class="form-label">Número Exterior</label>
                  <input type="text" class="form-control" [(ngModel)]="employee.exterior_number" name="exterior_number">
                </div>
                <div class="col-md-3">
                  <label class="form-label">Número Interior</label>
                  <input type="text" class="form-control" [(ngModel)]="employee.interior_number" name="interior_number">
                </div>
              </div>
              <div class="row mb-3">
                <div class="col-md-4">
                  <label class="form-label">Colonia</label>
                  <input type="text" class="form-control" [(ngModel)]="employee.neighborhood" name="neighborhood">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Municipio / Alcaldía</label>
                  <input type="text" class="form-control" [(ngModel)]="employee.municipality" name="municipality">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Estado</label>
                  <select class="form-select" [(ngModel)]="employee.state" name="state">
                    <option value="">Seleccionar...</option>
                    <option value="AGU">Aguascalientes</option>
                    <option value="BCN">Baja California</option>
                    <option value="BCS">Baja California Sur</option>
                    <option value="CAM">Campeche</option>
                    <option value="CHP">Chiapas</option>
                    <option value="CHH">Chihuahua</option>
                    <option value="COA">Coahuila</option>
                    <option value="COL">Colima</option>
                    <option value="CMX">Ciudad de México</option>
                    <option value="DUR">Durango</option>
                    <option value="GUA">Guanajuato</option>
                    <option value="GRO">Guerrero</option>
                    <option value="HID">Hidalgo</option>
                    <option value="JAL">Jalisco</option>
                    <option value="MEX">Estado de México</option>
                    <option value="MIC">Michoacán</option>
                    <option value="MOR">Morelos</option>
                    <option value="NAY">Nayarit</option>
                    <option value="NLE">Nuevo León</option>
                    <option value="OAX">Oaxaca</option>
                    <option value="PUE">Puebla</option>
                    <option value="QUE">Querétaro</option>
                    <option value="ROO">Quintana Roo</option>
                    <option value="SLP">San Luis Potosí</option>
                    <option value="SIN">Sinaloa</option>
                    <option value="SON">Sonora</option>
                    <option value="TAB">Tabasco</option>
                    <option value="TAM">Tamaulipas</option>
                    <option value="TLA">Tlaxcala</option>
                    <option value="VER">Veracruz</option>
                    <option value="YUC">Yucatán</option>
                    <option value="ZAC">Zacatecas</option>
                  </select>
                </div>
              </div>
              <div class="row mb-3">
                <div class="col-md-4">
                  <label class="form-label">Código Postal</label>
                  <input type="text" class="form-control" [(ngModel)]="employee.postal_code"
                    name="postal_code" maxlength="5" pattern="^[0-9]{5}$">
                </div>
                <div class="col-md-4">
                  <label class="form-label">País</label>
                  <select class="form-select" [(ngModel)]="employee.country" name="country">
                    <option value="MEX">México</option>
                    <option value="USA">Estados Unidos</option>
                    <option value="CAN">Canadá</option>
                    <option value="OTR">Otro</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab: Datos Bancarios -->
          <div class="card mb-3" *ngIf="activeTab === 'bank'">
            <div class="card-header">
              <h5 class="mb-0"><i class="fa fa-university me-2"></i>Datos Bancarios</h5>
            </div>
            <div class="card-body">
              <div class="row mb-3">
                <div class="col-md-4">
                  <label class="form-label">Banco</label>
                  <select class="form-select" [(ngModel)]="employee.bank_name" name="bank_name">
                    <option value="">Seleccionar...</option>
                    <option value="002">BANAMEX</option>
                    <option value="012">BBVA MEXICO</option>
                    <option value="014">SANTANDER</option>
                    <option value="021">HSBC</option>
                    <option value="036">INBURSA</option>
                    <option value="044">SCOTIABANK</option>
                    <option value="058">BANREGIO</option>
                    <option value="072">BANORTE</option>
                    <option value="127">AZTECA</option>
                    <option value="128">AUTOFIN</option>
                    <option value="130">COMPARTAMOS</option>
                    <option value="138">BANCOPPEL</option>
                    <option value="145">BIM</option>
                    <option value="646">STP</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Tipo de Cuenta</label>
                  <select class="form-select" [(ngModel)]="employee.bank_account_type" name="bank_account_type">
                    <option value="">Seleccionar...</option>
                    <option value="debito">Débito</option>
                    <option value="nomina">Nómina</option>
                    <option value="ahorro">Ahorro</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Número de Cuenta</label>
                  <input type="text" class="form-control" [(ngModel)]="employee.bank_account"
                    name="bank_account" maxlength="20">
                </div>
              </div>
              <div class="row mb-3">
                <div class="col-md-6">
                  <label class="form-label">CLABE Interbancaria <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" [(ngModel)]="employee.clabe"
                    name="clabe" maxlength="18" pattern="^[0-9]{18}$"
                    placeholder="18 dígitos">
                  <small class="text-muted">Requerido para dispersión de nómina</small>
                </div>
              </div>

              <div class="alert alert-warning">
                <i class="fa fa-exclamation-triangle me-2"></i>
                <strong>Importante:</strong> Verifique que la CLABE sea correcta.
                Los pagos de nómina se dispersarán a esta cuenta.
              </div>
            </div>
          </div>

          <!-- Tab: Documentos -->
          <div class="card mb-3" *ngIf="activeTab === 'documents'">
            <div class="card-header">
              <h5 class="mb-0"><i class="fa fa-id-card me-2"></i>Documentos de Identidad</h5>
            </div>
            <div class="card-body">
              <div class="row mb-3">
                <div class="col-md-6">
                  <label class="form-label">Clave de Elector (INE)</label>
                  <input type="text" class="form-control" [(ngModel)]="employee.ine_number"
                    name="ine_number" maxlength="18">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Vigencia INE</label>
                  <input type="date" class="form-control" [(ngModel)]="employee.ine_expiration"
                    name="ine_expiration">
                </div>
              </div>
              <div class="row mb-3">
                <div class="col-md-6">
                  <label class="form-label">Número de Pasaporte</label>
                  <input type="text" class="form-control" [(ngModel)]="employee.passport_number"
                    name="passport_number">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Vigencia Pasaporte</label>
                  <input type="date" class="form-control" [(ngModel)]="employee.passport_expiration"
                    name="passport_expiration">
                </div>
              </div>

              <hr>
              <h6>Documentos Adjuntos</h6>

              <div class="table-responsive">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Documento</th>
                      <th>Archivo</th>
                      <th>Fecha</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let doc of employee.documents">
                      <td>{{doc.document_type}}</td>
                      <td>{{doc.file_name}}</td>
                      <td>{{doc.uploaded_at | date:'dd/MM/yyyy'}}</td>
                      <td>
                        <button type="button" class="btn btn-sm btn-outline-primary" (click)="downloadDocument(doc)">
                          <i class="fa fa-download"></i>
                        </button>
                      </td>
                    </tr>
                    <tr *ngIf="!employee.documents?.length">
                      <td colspan="4" class="text-center text-muted">No hay documentos adjuntos</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="row mt-3">
                <div class="col-md-4">
                  <select class="form-select" [(ngModel)]="uploadDocType" name="uploadDocType">
                    <option value="">Tipo de documento...</option>
                    <option value="ine_frente">INE Frente</option>
                    <option value="ine_reverso">INE Reverso</option>
                    <option value="curp">CURP</option>
                    <option value="rfc">Constancia RFC</option>
                    <option value="comprobante_domicilio">Comprobante Domicilio</option>
                    <option value="acta_nacimiento">Acta de Nacimiento</option>
                    <option value="nss">Número Seguro Social</option>
                    <option value="estado_cuenta">Estado de Cuenta Bancario</option>
                  </select>
                </div>
                <div class="col-md-5">
                  <input type="file" class="form-control" (change)="onFileSelected($event)" #fileInput>
                </div>
                <div class="col-md-3">
                  <button type="button" class="btn btn-outline-primary w-100" (click)="uploadDocument()">
                    <i class="fa fa-upload me-1"></i> Subir
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab: Créditos INFONAVIT/FONACOT -->
          <div class="card mb-3" *ngIf="activeTab === 'credits'">
            <div class="card-header">
              <h5 class="mb-0"><i class="fa fa-credit-card me-2"></i>Créditos y Descuentos</h5>
            </div>
            <div class="card-body">
              <h6><i class="fa fa-home me-2"></i>INFONAVIT</h6>
              <div class="row mb-3">
                <div class="col-md-4">
                  <label class="form-label">Número de Crédito</label>
                  <input type="text" class="form-control" [(ngModel)]="employee.infonavit_credit_number"
                    name="infonavit_credit_number">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Tipo de Descuento</label>
                  <select class="form-select" [(ngModel)]="employee.infonavit_discount_type"
                    name="infonavit_discount_type">
                    <option value="">Sin crédito</option>
                    <option value="percentage">Porcentaje</option>
                    <option value="fixed">Cuota Fija ($)</option>
                    <option value="vsm">VSM (Veces Salario Mínimo)</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Valor de Descuento</label>
                  <input type="number" class="form-control" [(ngModel)]="employee.infonavit_discount_value"
                    name="infonavit_discount_value" step="0.01">
                </div>
              </div>

              <hr>

              <h6><i class="fa fa-wallet me-2"></i>FONACOT</h6>
              <div class="row mb-3">
                <div class="col-md-6">
                  <label class="form-label">Número de Crédito</label>
                  <input type="text" class="form-control" [(ngModel)]="employee.fonacot_credit_number"
                    name="fonacot_credit_number">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Monto de Descuento Quincenal</label>
                  <div class="input-group">
                    <span class="input-group-text">$</span>
                    <input type="number" class="form-control" [(ngModel)]="employee.fonacot_discount_amount"
                      name="fonacot_discount_amount" step="0.01">
                  </div>
                </div>
              </div>

              <div class="alert alert-info">
                <i class="fa fa-info-circle me-2"></i>
                Los descuentos de INFONAVIT y FONACOT se aplicarán automáticamente en cada período de nómina.
              </div>
            </div>
          </div>

          <!-- Botones -->
          <div class="d-flex justify-content-end gap-2 mb-4">
            <button type="button" class="btn btn-secondary" (click)="clearEmployee()">
              <i class="fa fa-times me-1"></i> Cancelar
            </button>
            <button type="submit" class="btn btn-primary" [disabled]="saving">
              <i class="fa fa-save me-1"></i> {{saving ? 'Guardando...' : 'Guardar Cambios'}}
            </button>
          </div>
        </form>
      </div>
    </div>
    </main>
  `
})
export class EmployeeFiscalDataComponent implements OnInit {
  employees: any[] = [];
  employee: EmployeeFiscalData | null = null;
  selectedEmployeeId: number | null = null;
  activeTab = 'fiscal';
  saving = false;

  uploadDocType = '';
  selectedFile: File | null = null;

  constructor(
    private hrService: HumanResourcesService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadEmployees();

    const id = this.route.snapshot.params['id'];
    if (id) {
      this.selectedEmployeeId = +id;
      this.loadEmployee();
    }
  }

  loadEmployees() {
    this.hrService.getEmployees().subscribe({
      next: (res) => this.employees = res.data?.data || res.data || []
    });
  }

  loadEmployee() {
    if (!this.selectedEmployeeId) return;

    this.hrService.getEmployee(this.selectedEmployeeId).subscribe({
      next: (res) => {
        this.employee = res.data;
      }
    });
  }

  clearEmployee() {
    this.employee = null;
    this.selectedEmployeeId = null;
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  uploadDocument() {
    if (!this.selectedFile || !this.uploadDocType || !this.employee?.id) {
      alert('Seleccione tipo de documento y archivo');
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('document_type', this.uploadDocType);

    this.hrService.uploadEmployeeDocument(this.employee.id, formData).subscribe({
      next: () => {
        this.loadEmployee();
        this.selectedFile = null;
        this.uploadDocType = '';
      }
    });
  }

  downloadDocument(doc: any) {
    this.hrService.downloadEmployeeDocument(this.employee!.id!, doc.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.file_name;
        a.click();
      }
    });
  }

  save() {
    if (!this.employee) return;

    this.saving = true;
    this.hrService.updateEmployeeFiscalData(this.employee.id!, this.employee).subscribe({
      next: () => {
        this.saving = false;
        alert('Datos guardados correctamente');
      },
      error: () => this.saving = false
    });
  }
}
