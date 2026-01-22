import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HumanResourcesService } from '../../../servicios/human-resources.service';
import { SidebarComponent } from '../../sidebar/sidebar.component';

interface CalendarEvent {
  id: number;
  type: 'vacation' | 'leave' | 'disability' | 'birthday' | 'anniversary' | 'holiday' | 'contract_end';
  title: string;
  employee_name?: string;
  employee_id?: number;
  start_date: string;
  end_date?: string;
  color?: string;
}

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

@Component({
  selector: 'app-hr-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  template: `
    <app-sidebar></app-sidebar>
    <main class="main-content">
    <div class="container-fluid">
      <div class="row mb-3">
        <div class="col-12">
          <h4><i class="fa fa-calendar-alt me-2"></i>Calendario RRHH</h4>
        </div>
      </div>

      <!-- Filtros y Navegación -->
      <div class="card mb-3">
        <div class="card-body">
          <div class="row align-items-center">
            <div class="col-md-4">
              <div class="btn-group" role="group">
                <button type="button" class="btn btn-outline-primary" (click)="previousMonth()">
                  <i class="fa fa-chevron-left"></i>
                </button>
                <button type="button" class="btn btn-outline-primary" (click)="goToToday()">
                  Hoy
                </button>
                <button type="button" class="btn btn-outline-primary" (click)="nextMonth()">
                  <i class="fa fa-chevron-right"></i>
                </button>
              </div>
              <span class="ms-3 fw-bold fs-5">
                {{getMonthName(currentDate)}} {{currentDate.getFullYear()}}
              </span>
            </div>
            <div class="col-md-8 text-end">
              <div class="form-check form-check-inline">
                <input class="form-check-input" type="checkbox" [(ngModel)]="filters.vacations"
                  id="filterVacations" (change)="applyFilters()">
                <label class="form-check-label" for="filterVacations">
                  <span class="badge bg-success me-1">&nbsp;</span> Vacaciones
                </label>
              </div>
              <div class="form-check form-check-inline">
                <input class="form-check-input" type="checkbox" [(ngModel)]="filters.leaves"
                  id="filterLeaves" (change)="applyFilters()">
                <label class="form-check-label" for="filterLeaves">
                  <span class="badge bg-warning me-1">&nbsp;</span> Permisos
                </label>
              </div>
              <div class="form-check form-check-inline">
                <input class="form-check-input" type="checkbox" [(ngModel)]="filters.disabilities"
                  id="filterDisabilities" (change)="applyFilters()">
                <label class="form-check-label" for="filterDisabilities">
                  <span class="badge bg-danger me-1">&nbsp;</span> Incapacidades
                </label>
              </div>
              <div class="form-check form-check-inline">
                <input class="form-check-input" type="checkbox" [(ngModel)]="filters.birthdays"
                  id="filterBirthdays" (change)="applyFilters()">
                <label class="form-check-label" for="filterBirthdays">
                  <span class="badge bg-pink me-1" style="background-color:#e91e63">&nbsp;</span> Cumpleaños
                </label>
              </div>
              <div class="form-check form-check-inline">
                <input class="form-check-input" type="checkbox" [(ngModel)]="filters.anniversaries"
                  id="filterAnniversaries" (change)="applyFilters()">
                <label class="form-check-label" for="filterAnniversaries">
                  <span class="badge bg-info me-1">&nbsp;</span> Aniversarios
                </label>
              </div>
              <div class="form-check form-check-inline">
                <input class="form-check-input" type="checkbox" [(ngModel)]="filters.contracts"
                  id="filterContracts" (change)="applyFilters()">
                <label class="form-check-label" for="filterContracts">
                  <span class="badge bg-secondary me-1">&nbsp;</span> Venc. Contratos
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <!-- Calendario -->
        <div class="col-lg-9">
          <div class="card">
            <div class="card-body p-0">
              <!-- Headers días de semana -->
              <div class="calendar-header">
                <div class="calendar-day-header" *ngFor="let day of weekDays">{{day}}</div>
              </div>
              <!-- Días del mes -->
              <div class="calendar-body">
                <div *ngFor="let week of calendarWeeks" class="calendar-week">
                  <div *ngFor="let day of week"
                       class="calendar-day"
                       [class.other-month]="!day.isCurrentMonth"
                       [class.today]="day.isToday"
                       (click)="selectDay(day)">
                    <div class="day-number">{{day.day}}</div>
                    <div class="day-events">
                      <div *ngFor="let event of day.events.slice(0, 3)"
                           class="event-badge"
                           [ngStyle]="{'background-color': getEventColor(event.type)}"
                           [title]="event.title">
                        {{event.title | slice:0:15}}{{event.title.length > 15 ? '...' : ''}}
                      </div>
                      <div *ngIf="day.events.length > 3" class="event-more">
                        +{{day.events.length - 3}} más
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Panel lateral -->
        <div class="col-lg-3">
          <!-- Día seleccionado -->
          <div class="card mb-3" *ngIf="selectedDay">
            <div class="card-header">
              <h6 class="mb-0">
                <i class="fa fa-calendar-day me-2"></i>
                {{formatDate(selectedDay.date)}}
              </h6>
            </div>
            <div class="card-body">
              <div *ngIf="selectedDay.events.length === 0" class="text-muted text-center py-3">
                <i class="fa fa-calendar-times fa-2x mb-2"></i>
                <p class="mb-0">Sin eventos</p>
              </div>
              <div *ngFor="let event of selectedDay.events" class="event-item mb-2 p-2 rounded"
                   [ngStyle]="{'border-left': '4px solid ' + getEventColor(event.type)}">
                <div class="fw-bold">{{getEventTypeLabel(event.type)}}</div>
                <div>{{event.title}}</div>
                <small class="text-muted" *ngIf="event.employee_name">
                  {{event.employee_name}}
                </small>
              </div>
            </div>
          </div>

          <!-- Próximos cumpleaños -->
          <div class="card mb-3">
            <div class="card-header">
              <h6 class="mb-0">
                <i class="fa fa-birthday-cake me-2" style="color:#e91e63"></i>
                Próximos Cumpleaños
              </h6>
            </div>
            <div class="card-body" style="max-height: 200px; overflow-y: auto;">
              <div *ngIf="upcomingBirthdays.length === 0" class="text-muted text-center">
                Sin cumpleaños próximos
              </div>
              <div *ngFor="let item of upcomingBirthdays" class="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <i class="fa fa-user me-1"></i>
                  {{item.name}}
                </div>
                <small class="text-muted">{{item.date}}</small>
              </div>
            </div>
          </div>

          <!-- Próximos aniversarios -->
          <div class="card mb-3">
            <div class="card-header">
              <h6 class="mb-0">
                <i class="fa fa-award me-2 text-info"></i>
                Próximos Aniversarios
              </h6>
            </div>
            <div class="card-body" style="max-height: 200px; overflow-y: auto;">
              <div *ngIf="upcomingAnniversaries.length === 0" class="text-muted text-center">
                Sin aniversarios próximos
              </div>
              <div *ngFor="let item of upcomingAnniversaries" class="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <i class="fa fa-user me-1"></i>
                  {{item.name}}
                  <small class="badge bg-info">{{item.years}} años</small>
                </div>
                <small class="text-muted">{{item.date}}</small>
              </div>
            </div>
          </div>

          <!-- Contratos por vencer -->
          <div class="card">
            <div class="card-header">
              <h6 class="mb-0">
                <i class="fa fa-file-contract me-2 text-warning"></i>
                Contratos por Vencer
              </h6>
            </div>
            <div class="card-body" style="max-height: 200px; overflow-y: auto;">
              <div *ngIf="expiringContracts.length === 0" class="text-muted text-center">
                Sin contratos por vencer
              </div>
              <div *ngFor="let item of expiringContracts" class="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <i class="fa fa-user me-1"></i>
                  {{item.employee_name}}
                </div>
                <small class="text-danger">{{item.end_date}}</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </main>
  `,
  styles: [`
    .calendar-header {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      background-color: #f8f9fa;
      border-bottom: 1px solid #dee2e6;
    }
    .calendar-day-header {
      padding: 10px;
      text-align: center;
      font-weight: bold;
      color: #495057;
    }
    .calendar-body {
      display: flex;
      flex-direction: column;
    }
    .calendar-week {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
    }
    .calendar-day {
      min-height: 100px;
      border: 1px solid #dee2e6;
      padding: 5px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .calendar-day:hover {
      background-color: #f8f9fa;
    }
    .calendar-day.other-month {
      background-color: #f1f1f1;
      color: #adb5bd;
    }
    .calendar-day.today {
      background-color: #e7f1ff;
      border-color: #0d6efd;
    }
    .day-number {
      font-weight: bold;
      margin-bottom: 5px;
    }
    .day-events {
      font-size: 0.75rem;
    }
    .event-badge {
      padding: 2px 5px;
      margin-bottom: 2px;
      border-radius: 3px;
      color: white;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .event-more {
      color: #6c757d;
      font-style: italic;
    }
    .event-item {
      background-color: #f8f9fa;
    }
  `]
})
export class HrCalendarComponent implements OnInit {
  currentDate = new Date();
  selectedDay: CalendarDay | null = null;
  calendarWeeks: CalendarDay[][] = [];
  events: CalendarEvent[] = [];

  weekDays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  filters = {
    vacations: true,
    leaves: true,
    disabilities: true,
    birthdays: true,
    anniversaries: true,
    contracts: true
  };

  upcomingBirthdays: any[] = [];
  upcomingAnniversaries: any[] = [];
  expiringContracts: any[] = [];

  constructor(private hrService: HumanResourcesService) {}

  ngOnInit() {
    this.buildCalendar();
    this.loadEvents();
    this.loadUpcomingEvents();
  }

  buildCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

    const weeks: CalendarDay[][] = [];
    let currentWeek: CalendarDay[] = [];
    const today = new Date();

    const current = new Date(startDate);
    while (current <= endDate) {
      const dayDate = new Date(current);
      currentWeek.push({
        date: dayDate,
        day: dayDate.getDate(),
        isCurrentMonth: dayDate.getMonth() === month,
        isToday: this.isSameDay(dayDate, today),
        events: []
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      current.setDate(current.getDate() + 1);
    }

    this.calendarWeeks = weeks;
  }

  loadEvents() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

    // Cargar todos los eventos, el filtrado se hace en el frontend
    this.hrService.getCalendarEvents({ start_date: startDate, end_date: endDate }).subscribe({
      next: (res) => {
        this.events = res.data || [];
        this.assignEventsToCalendar();
      },
      error: () => {
        // Datos de demo si el API no está disponible
        this.events = this.generateDemoEvents();
        this.assignEventsToCalendar();
      }
    });
  }

  /**
   * Aplicar filtros sin recargar del backend
   */
  applyFilters() {
    this.assignEventsToCalendar();
  }

  assignEventsToCalendar() {
    // Limpiar eventos previos
    this.calendarWeeks.forEach(week => {
      week.forEach(day => {
        day.events = [];
      });
    });

    // Filtrar eventos según los checkboxes activos
    const filteredEvents = this.events.filter(event => {
      switch (event.type) {
        case 'vacation': return this.filters.vacations;
        case 'leave': return this.filters.leaves;
        case 'disability': return this.filters.disabilities;
        case 'birthday': return this.filters.birthdays;
        case 'anniversary': return this.filters.anniversaries;
        case 'contract_end': return this.filters.contracts;
        default: return true;
      }
    });

    // Asignar eventos filtrados a días
    filteredEvents.forEach(event => {
      const eventStart = new Date(event.start_date);
      const eventEnd = event.end_date ? new Date(event.end_date) : eventStart;

      this.calendarWeeks.forEach(week => {
        week.forEach(day => {
          if (this.isDateInRange(day.date, eventStart, eventEnd)) {
            day.events.push(event);
          }
        });
      });
    });
  }

  loadUpcomingEvents() {
    this.hrService.getUpcomingBirthdays(30).subscribe({
      next: (res) => this.upcomingBirthdays = res.data || [],
      error: () => this.upcomingBirthdays = []
    });

    this.hrService.getUpcomingAnniversaries(30).subscribe({
      next: (res) => this.upcomingAnniversaries = res.data || [],
      error: () => this.upcomingAnniversaries = []
    });

    this.hrService.getContracts({ expiring_soon: true }).subscribe({
      next: (res) => this.expiringContracts = (res.data?.data || res.data || []).slice(0, 5),
      error: () => this.expiringContracts = []
    });
  }

  generateDemoEvents(): CalendarEvent[] {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    return [
      { id: 1, type: 'vacation', title: 'Vacaciones - Juan Pérez', start_date: `${year}-${String(month+1).padStart(2,'0')}-10`, end_date: `${year}-${String(month+1).padStart(2,'0')}-15` },
      { id: 2, type: 'birthday', title: 'Cumpleaños María García', start_date: `${year}-${String(month+1).padStart(2,'0')}-12` },
      { id: 3, type: 'disability', title: 'Incapacidad - Carlos López', start_date: `${year}-${String(month+1).padStart(2,'0')}-05`, end_date: `${year}-${String(month+1).padStart(2,'0')}-08` },
      { id: 4, type: 'anniversary', title: '5 años - Ana Martínez', start_date: `${year}-${String(month+1).padStart(2,'0')}-18` },
      { id: 5, type: 'leave', title: 'Permiso personal - Roberto', start_date: `${year}-${String(month+1).padStart(2,'0')}-22` },
      { id: 6, type: 'contract_end', title: 'Fin contrato - Luis Torres', start_date: `${year}-${String(month+1).padStart(2,'0')}-28` }
    ];
  }

  previousMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.buildCalendar();
    this.loadEvents();
  }

  nextMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.buildCalendar();
    this.loadEvents();
  }

  goToToday() {
    this.currentDate = new Date();
    this.buildCalendar();
    this.loadEvents();
  }

  selectDay(day: CalendarDay) {
    this.selectedDay = day;
  }

  getMonthName(date: Date): string {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[date.getMonth()];
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  getEventColor(type: string): string {
    const colors: { [key: string]: string } = {
      'vacation': '#28a745',
      'leave': '#ffc107',
      'disability': '#dc3545',
      'birthday': '#e91e63',
      'anniversary': '#17a2b8',
      'holiday': '#6f42c1',
      'contract_end': '#6c757d'
    };
    return colors[type] || '#6c757d';
  }

  getEventTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'vacation': 'Vacaciones',
      'leave': 'Permiso',
      'disability': 'Incapacidad',
      'birthday': 'Cumpleaños',
      'anniversary': 'Aniversario',
      'holiday': 'Día Festivo',
      'contract_end': 'Venc. Contrato'
    };
    return labels[type] || type;
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  isDateInRange(date: Date, start: Date, end: Date): boolean {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    return d >= s && d <= e;
  }
}
