import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationAnalyticsService } from '../../../../../core/services/notification-analytics.service';
import { UserNotificationEfficiency } from '../../../../../shared/models/notification-analytics.model';

@Component({
  selector: 'app-user-notification-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-notification-profile.component.html',
  styleUrls: ['./user-notification-profile.component.css']
})
export class UserNotificationProfileComponent implements OnInit, OnChanges {
  @Input() userId: number = 1;

  metrics?: UserNotificationEfficiency;
  loading = false;
  error?: string;

  constructor(private analytics: NotificationAnalyticsService) {}

  ngOnInit(): void {
    this.loadMetrics();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userId'] && !changes['userId'].firstChange) {
      this.loadMetrics();
    }
  }

  loadMetrics(): void {
    this.loading = true;
    this.error = undefined;

    this.analytics.getUserMetrics(this.userId).subscribe({
      next: (m) => {
        this.metrics = m ?? undefined;
        this.loading = false;
        if (!m) {
          this.error = 'No se encontraron métricas para este usuario';
        }
      },
      error: () => {
        this.error = 'Error al cargar las métricas del usuario';
        this.loading = false;
      }
    });
  }

  formatTime(ms: number): string {
    if (!ms || ms <= 0) return '-';
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  getComplianceClass(rate?: number): string {
    if (rate === undefined) return 'text-muted';
    if (rate >= 80) return 'text-success';
    if (rate >= 50) return 'text-warning';
    return 'text-danger';
  }
}
