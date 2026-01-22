import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CompanyEntity } from './company.model';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  constructor(private http: HttpClient) {}

  getEntities(apiUrl: string): Observable<CompanyEntity[]> {
    return this.http.get<CompanyEntity[]>(apiUrl);
  }

  getEntity(apiUrl: string, id: number): Observable<CompanyEntity> {
    return this.http.get<CompanyEntity>(`${apiUrl}/${id}`);
  }

  addEntity(apiUrl: string, entity: CompanyEntity): Observable<CompanyEntity> {
    return this.http.post<CompanyEntity>(apiUrl, entity);
  }

  updateEntity(apiUrl: string, id: number, entity: CompanyEntity): Observable<CompanyEntity> {
    return this.http.put<CompanyEntity>(`${apiUrl}/${id}`, entity);
  }

  deleteEntity(apiUrl: string, id: number): Observable<void> {
    return this.http.delete<void>(`${apiUrl}/${id}`);
  }
}
