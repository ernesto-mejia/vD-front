import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import { LogsService } from '../logs.service';
import { ActivityLog, ActivityLogFilters, LogFilterOptions } from '../logs';

@Component({
  selector: 'app-logs-list',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './logs-list.component.html',
  styleUrl: './logs-list.component.css'
})
export class LogsListComponent implements OnInit {
  // Lista de logs
  logs: ActivityLog[] = [];

  // Estado de carga
  isLoading = false;
  errorMessage = '';

  // Paginación
  currentPage = 1;
  lastPage = 1;
  perPage = 15;
  total = 0;
  from = 0;
  to = 0;

  // Filtros
  filters: ActivityLogFilters = {
    event: '',
    log_name: '',
    user_search: '',
    from: '',
    to: '',
    sort_by: 'created_at',
    sort_dir: 'desc',
    per_page: 15,
    page: 1
  };

  // Opciones para los selectores
  filterOptions: LogFilterOptions;

  // Estado de filtros avanzados
  showAdvancedFilters = false;

  constructor(private logsService: LogsService) {
    this.filterOptions = this.logsService.getFilterOptions();
  }

  ngOnInit(): void {
    this.loadLogs();
  }

  /**
   * Carga los logs con los filtros actuales
   */
  loadLogs(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Actualizar filtros con la página actual
    const requestFilters: ActivityLogFilters = {
      ...this.filters,
      page: this.currentPage,
      per_page: this.perPage
    };

    this.logsService.getActivityLogs(requestFilters).subscribe({
      next: (response) => {
        this.logs = response.data || [];
        if (response.meta) {
          this.currentPage = response.meta.current_page;
          this.lastPage = response.meta.last_page;
          this.perPage = response.meta.per_page;
          this.total = response.meta.total;
          this.from = response.meta.from;
          this.to = response.meta.to;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar logs:', error);
        this.errorMessage = 'Error al cargar los logs. Por favor, intente nuevamente.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Aplica los filtros y recarga los logs
   */
  applyFilters(): void {
    this.currentPage = 1;
    this.loadLogs();
  }

  /**
   * Limpia todos los filtros
   */
  clearFilters(): void {
    this.filters = {
      event: '',
      log_name: '',
      user_search: '',
      from: '',
      to: '',
      sort_by: 'created_at',
      sort_dir: 'desc',
      per_page: 15,
      page: 1
    };
    this.currentPage = 1;
    this.perPage = 15;
    this.loadLogs();
  }

  /**
   * Cambia el número de registros por página
   */
  onPerPageChange(): void {
    this.currentPage = 1;
    this.filters.per_page = this.perPage;
    this.loadLogs();
  }

  /**
   * Va a la página anterior
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadLogs();
    }
  }

  /**
   * Va a la siguiente página
   */
  nextPage(): void {
    if (this.currentPage < this.lastPage) {
      this.currentPage++;
      this.loadLogs();
    }
  }

  /**
   * Va a una página específica
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.lastPage) {
      this.currentPage = page;
      this.loadLogs();
    }
  }

  /**
   * Genera el array de páginas para el paginador
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.lastPage, startPage + maxPages - 1);

    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  /**
   * Obtiene el label del evento
   */
  getEventLabel(event: string): string {
    return this.logsService.getEventLabel(event);
  }

  /**
   * Obtiene la clase CSS del badge del evento
   */
  getEventClass(event: string): string {
    return this.logsService.getEventClass(event);
  }

  /**
   * Alterna la visibilidad de los filtros avanzados
   */
  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  /**
   * Formatea la fecha para mostrar
   */
  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtiene el nombre del usuario que realizó la acción
   */
  getCauserName(log: ActivityLog): string {
    if (log.causer && log.causer.name) {
      return log.causer.name;
    }
    return log.causer_id ? `Usuario #${log.causer_id}` : 'Sistema';
  }

  /**
   * Formatea las propiedades para mostrar
   */
  formatProperties(properties: any): string {
    if (!properties) return '-';
    try {
      return JSON.stringify(properties, null, 2);
    } catch {
      return String(properties);
    }
  }
}
