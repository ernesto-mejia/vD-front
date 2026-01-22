import { Component, OnInit, ElementRef, ViewChild, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationAnalyticsService, DashboardAnalytics, ModuleBreakdown, TimeSeriesData } from '../../../../../core/services/notification-analytics.service';
import { UserRadarData } from '../../../../../shared/models/notification-analytics.model';
import * as am5 from '@amcharts/amcharts5';
import * as am5radar from '@amcharts/amcharts5/radar';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

@Component({
  selector: 'app-notification-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notification-analytics.component.html',
  styleUrls: ['./notification-analytics.component.css']
})
export class NotificationAnalyticsComponent implements OnInit, OnDestroy {
  @ViewChild('radarChart', { static: true }) radarChartRef!: ElementRef<HTMLDivElement>;
  @Input() userId: number = 1; // userId por defecto, puede ser pasado como input

  private root?: am5.Root;
  loading = false;
  error?: string;

  // Toggle para vista global/personal
  viewMode: 'global' | 'personal' = 'global';
  currentUserId: number | null = null;

  // Datos del dashboard
  dashboard?: DashboardAnalytics;
  radarData?: UserRadarData;
  moduleBreakdown: ModuleBreakdown[] = [];
  timeSeries: TimeSeriesData[] = [];

  constructor(private analytics: NotificationAnalyticsService) {
    // Obtener el userId del usuario logueado desde localStorage
    const storedUserId = localStorage.getItem('user_id');
    this.currentUserId = storedUserId ? parseInt(storedUserId, 10) : null;
  }

  ngOnInit(): void {
    this.loadDashboard();
    this.loadRadarData();
    this.loadModuleBreakdown();
    this.loadTimeSeries();
  }

  ngOnDestroy(): void {
    this.root?.dispose();
  }

  // Obtener el userId para las peticiones según el modo de vista
  private getFilterUserId(): number | undefined {
    return this.viewMode === 'personal' && this.currentUserId ? this.currentUserId : undefined;
  }

  // Cambiar el modo de vista
  onViewModeChange(): void {
    this.refresh();
  }

  private loadDashboard(): void {
    this.loading = true;
    const userId = this.getFilterUserId();
    this.analytics.getDashboard(userId).subscribe({
      next: (data) => {
        this.dashboard = data ?? {
          totalNotifications: 0,
          pendingNotifications: 0,
          pendingCount: 0,
          viewedNotifications: 0,
          attendedNotifications: 0,
          avgResponseTime: 0,
          avgResponseTimeMinutes: 0,
          criticalCount: 0,
          warningCount: 0,
          infoCount: 0,
          byStatus: {
            pending: 0,
            sent: 0,
            viewed: 0,
            attended: 0,
            accepted: 0,
            rejected: 0
          },
          bySeverity: {
            info: 0,
            warning: 0,
            critical: 0
          }
        };
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar el dashboard';
        this.loading = false;
      }
    });
  }

  private loadRadarData(): void {
    const userId = this.viewMode === 'personal' && this.currentUserId ? this.currentUserId : this.userId;
    this.analytics.getUserRadar(userId).subscribe({
      next: (data) => {
        this.radarData = data ?? undefined;
        if (this.radarData) {
          this.renderRadar();
        }
      },
      error: () => {
        console.warn('No se pudo cargar datos del radar');
      }
    });
  }

  private loadModuleBreakdown(): void {
    const userId = this.getFilterUserId();
    this.analytics.getModuleBreakdown(userId).subscribe({
      next: (data) => {
        this.moduleBreakdown = data;
      }
    });
  }

  private loadTimeSeries(): void {
    const userId = this.getFilterUserId();
    this.analytics.getTimeSeries(30, userId).subscribe({
      next: (data) => {
        this.timeSeries = data;
      }
    });
  }

  private renderRadar(): void {
    if (!this.radarData || !this.radarChartRef?.nativeElement) return;

    this.root?.dispose();
    this.root = am5.Root.new(this.radarChartRef.nativeElement);
    this.root.setThemes([am5themes_Animated.new(this.root)]);

    const chart = this.root.container.children.push(am5radar.RadarChart.new(this.root, {
      panX: false,
      panY: false,
      wheelX: 'none',
      wheelY: 'none'
    }));

    // Renderers
    const xRenderer = am5radar.AxisRendererCircular.new(this.root, { minGridDistance: 20 });
    const yRenderer = am5radar.AxisRendererRadial.new(this.root, { minGridDistance: 30 });

    // Ejes: usar ValueAxis y CategoryAxis desde am5xy
    const valueAxis = chart.xAxes.push(am5xy.ValueAxis.new(this.root, {
      renderer: xRenderer,
      min: 0,
      max: 100
    }));

    const categoryAxis = chart.yAxes.push(am5xy.CategoryAxis.new(this.root, {
      renderer: yRenderer,
      categoryField: 'axis'
    }));

    const series = chart.series.push(am5radar.RadarLineSeries.new(this.root, {
      name: 'Eficiencia',
      xAxis: valueAxis,
      yAxis: categoryAxis,
      valueXField: 'value',
      categoryYField: 'axis'
    }));

    categoryAxis.data.setAll(this.radarData.points);
    series.data.setAll(this.radarData.points);
  }

  refresh(): void {
    this.loadDashboard();
    this.loadRadarData();
    this.loadModuleBreakdown();
    this.loadTimeSeries();
  }

  // Helpers para el template
  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Pendientes',
      'sent': 'Enviadas',
      'viewed': 'Vistas',
      'attended': 'Atendidas',
      'accepted': 'Aceptadas',
      'rejected': 'Rechazadas'
    };
    return labels[status] || status;
  }

  getModuleLabel(module: string): string {
    const labels: { [key: string]: string } = {
      'users': 'Usuarios',
      'customers': 'Clientes',
      'providers': 'Proveedores'
    };
    return labels[module] || module;
  }
}
