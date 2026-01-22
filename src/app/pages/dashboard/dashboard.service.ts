import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Kpi } from './kpi.model';
import { apiEndpoint } from '../../shared/api-endpoint.util';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  // Usa apiEndpoint global

  constructor(private http: HttpClient) {}

  getKpis(): Observable<Kpi[]> {
    const url = apiEndpoint('dashboard/kpis');
    return this.http
      .get<{ data: Kpi[] }>(url)
      .pipe(map((response) => response?.data ?? []));
  }
}
