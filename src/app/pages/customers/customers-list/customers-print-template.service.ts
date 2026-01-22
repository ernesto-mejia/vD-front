import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

export interface CustomersPrintTemplates {
  styles: string;
  header: string;
  footer: string;
}

@Injectable({ providedIn: 'root' })
export class CustomersPrintTemplateService {
  private templates$?: Observable<CustomersPrintTemplates>;

  constructor(private readonly http: HttpClient) {}

  getTemplates(): Observable<CustomersPrintTemplates> {
    if (!this.templates$) {
      this.templates$ = this.loadTemplates().pipe(shareReplay(1));
    }

    return this.templates$;
  }

  private loadTemplates(): Observable<CustomersPrintTemplates> {
    const basePath = '/print/customers-list';

    return forkJoin({
      styles: this.http.get(`${basePath}/styles.css`, { responseType: 'text' }),
      header: this.http.get(`${basePath}/header.html`, { responseType: 'text' }),
      footer: this.http.get(`${basePath}/footer.html`, { responseType: 'text' })
    });
  }
}
