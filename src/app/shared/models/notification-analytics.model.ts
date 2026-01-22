export interface NotificationTimingMetrics {
  notificationId: number;
  createdAt: string; // ISO
  viewedAt?: string;
  attendedAt?: string;
  finalizedAt?: string;
  timeToViewMs?: number; // viewed - created
  timeToAttendMs?: number; // attended - viewed
  timeTotalMs?: number; // finalized - created
  module: string;
  action: string;
  severity: string;
}

export interface UserNotificationEfficiency {
  userId: number;
  userName: string;
  avgTimeToViewMs: number;
  avgTimeToAttendMs: number;
  avgTimeTotalMs: number;
  processedCount: number;
  pendingCount: number;
  rejectionRate: number; // porcentaje
  complianceRate: number;
  hourlyEfficiency: number;
  lastAction: string;
  period: {
    start: string;
    end: string;
  };
  suggestions: string[];
}

export interface RadarMetricPoint {
  axis: string; // nombre métrica
  value: number; // normalizado 0-100
}

export interface UserRadarData {
  userId: number;
  points: RadarMetricPoint[];
}
