import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

export interface ProvidersPrintTemplates {
  styles: string;
  header: string;
  footer: string;
}

@Injectable({ providedIn: 'root' })
export class ProvidersPrintTemplateService {
  private templates$?: Observable<ProvidersPrintTemplates>;

  constructor(private readonly http: HttpClient) {}

  getTemplates(): Observable<ProvidersPrintTemplates> {
    if (!this.templates$) {
      this.templates$ = this.loadTemplates().pipe(shareReplay(1));
    }

    return this.templates$;
  }

  private loadTemplates(): Observable<ProvidersPrintTemplates> {
    const basePath = '/print/provider';

    return forkJoin({
      styles: this.http.get(`${basePath}/styles.css`, { responseType: 'text' }),
      header: this.http.get(`${basePath}/header.html`, { responseType: 'text' }),
      footer: this.http.get(`${basePath}/footer.html`, { responseType: 'text' })
    });
  }
}
