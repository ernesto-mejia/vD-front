import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { notificationEndpoint } from '../../shared/api-endpoint.util';
import { NotificationTimingMetrics, UserNotificationEfficiency, UserRadarData } from '../../shared/models/notification-analytics.model';
import { NotificationLog } from '../../shared/models/notification.model';

export interface NotificationLogItem {
  id: number;
  notificationId: number;
  userId: number;
  userName?: string;
  action: string;
  details?: string;
  timestamp: string;
}

export interface DashboardAnalytics {
  totalNotifications: number;
  pendingNotifications: number;
  pendingCount: number;
  viewedNotifications: number;
  attendedNotifications: number;
  avgResponseTime: number;
  avgResponseTimeMinutes: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  byStatus: {
    [key: string]: number;
    pending: number;
    sent: number;
    viewed: number;
    attended: number;
    accepted: number;
    rejected: number;
  };
  bySeverity: {
    info: number;
    warning: number;
    critical: number;
  };
  weeklyTrend?: Array<{
    day: string;
    date: string;
    count: number;
  }>;
}

export interface ModuleBreakdown {
  module: string;
  count: number;
  percentage: number;
}

export interface TimeSeriesData {
  date: string;
  count: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationAnalyticsService {
  constructor(private http: HttpClient) {}

  getUserMetrics(userId: number): Observable<UserNotificationEfficiency> {
    return this.http.get<any>(notificationEndpoint(`notifications/analytics/user/${userId}`)).pipe(
      map(resp => resp.data as UserNotificationEfficiency)
    );
  }

  getUserRadar(userId: number): Observable<UserRadarData> {
    return this.http.get<any>(notificationEndpoint(`notifications/analytics/user/${userId}/radar`)).pipe(
      map(resp => {
        const data = resp?.data || [];
        // Transform backend format to UserRadarData format
        const points = data.map((item: any) => ({
          axis: this.getModuleLabel(item.module),
          value: item.compliance_rate || 0
        }));
        return {
          userId: userId,
          points: points
        } as UserRadarData;
      })
    );
  }

  private getModuleLabel(module: string): string {
    const labels: { [key: string]: string } = {
      'users': 'Usuarios',
      'customers': 'Clientes',
      'clients': 'Clientes',
      'providers': 'Proveedores'
    };
    return labels[module] || module;
  }

  listTimings(userId?: number): Observable<NotificationTimingMetrics[]> {
    const path = userId ? `notifications/logs?user_id=${userId}` : 'notifications/logs';
    return this.http.get<any>(notificationEndpoint(path)).pipe(
      map(resp => resp.data as NotificationTimingMetrics[])
    );
  }

  getDashboard(userId?: number): Observable<DashboardAnalytics> {
    const params = userId ? `?user_id=${userId}` : '';
    return this.http.get<any>(notificationEndpoint(`notifications/analytics/dashboard${params}`)).pipe(
      map(resp => {
        const data = resp?.data || {};
        return {
          totalNotifications: data.totalNotifications || 0,
          pendingNotifications: data.pendingNotifications || 0,
          pendingCount: data.pendingCount || 0,
          viewedNotifications: data.viewedNotifications || 0,
          attendedNotifications: data.attendedNotifications || 0,
          avgResponseTime: data.avgResponseTime || 0,
          avgResponseTimeMinutes: data.avgResponseTimeMinutes || 0,
          criticalCount: data.criticalCount || 0,
          warningCount: data.warningCount || 0,
          infoCount: data.infoCount || 0,
          byStatus: {
            pending: data.byStatus?.pending || 0,
            sent: data.byStatus?.sent || 0,
            viewed: data.byStatus?.viewed || 0,
            attended: data.byStatus?.attended || 0,
            accepted: data.byStatus?.accepted || 0,
            rejected: data.byStatus?.rejected || 0
          },
          bySeverity: {
            info: data.bySeverity?.info || 0,
            warning: data.bySeverity?.warning || 0,
            critical: data.bySeverity?.critical || 0
          },
          weeklyTrend: data.weeklyTrend || []
        } as DashboardAnalytics;
      })
    );
  }

  getModuleBreakdown(userId?: number): Observable<ModuleBreakdown[]> {
    const params = userId ? `?user_id=${userId}` : '';
    return this.http.get<any>(notificationEndpoint(`notifications/analytics/module-breakdown${params}`)).pipe(
      map(resp => resp.data as ModuleBreakdown[])
    );
  }

  getTimeSeries(days: number = 30, userId?: number): Observable<TimeSeriesData[]> {
    let params = `?days=${days}`;
    if (userId) params += `&user_id=${userId}`;
    return this.http.get<any>(notificationEndpoint(`notifications/analytics/time-series${params}`)).pipe(
      map(resp => resp.data as TimeSeriesData[])
    );
  }

  getLogsByNotification(notificationId: number): Observable<NotificationLog[]> {
    return this.http.get<any>(notificationEndpoint(`notifications/logs?notification_id=${notificationId}`)).pipe(
      map(resp => resp.data as NotificationLog[])
    );
  }

  getNotificationLogs(params?: any): Observable<{ items: NotificationLogItem[]; total: number }> {
    let url = 'notifications/logs';
    if (params) {
      const queryParams = new URLSearchParams(params).toString();
      url += `?${queryParams}`;
    }
    return this.http.get<any>(notificationEndpoint(url)).pipe(
      map(resp => ({
        items: resp?.data || [],
        total: resp?.meta?.total || 0
      }))
    );
  }
}
