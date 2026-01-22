import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { apiEndpoint } from '../api-endpoint.util';

// ==================== INTERFACES ====================

/**
 * Tipo de documento del catálogo
 */
export interface DocumentType {
  id: number;
  name: string;
}

/**
 * Respuesta del catálogo de tipos de documentos
 */
export interface DocumentTypeCatalogResponse {
  data: DocumentType[];
}

/**
 * Documento adjunto
 */
export interface DocumentAttachment {
  id: number;
  document_type_id: number;
  document_type?: string;
  status: 'incomplete' | 'complete' | 'pending' | string;
  file_url?: string | null;
  description?: string | null;
  attachable_type: string;
  attachable_id: number;
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * Request para crear documento adjunto
 */
export interface DocumentAttachmentCreateRequest {
  document_type_id: number;
  attachable_type: string;
  attachable_id: number;
  status?: string;
  file_url?: string | null;
  description?: string | null;
}

/**
 * Request para actualizar documento adjunto
 */
export interface DocumentAttachmentUpdateRequest {
  document_type_id?: number;
  status?: string;
  file_url?: string | null;
  description?: string | null;
  attachable_type?: string;
  attachable_id?: number;
}

/**
 * Respuesta de un documento adjunto
 */
export interface DocumentAttachmentResponse {
  ok: boolean;
  data: DocumentAttachment;
}

/**
 * Respuesta del listado de documentos adjuntos
 */
export interface DocumentAttachmentListResponse {
  ok: boolean;
  data: DocumentAttachment[];
  meta?: {
    current_page: number;
    total: number;
    per_page: number;
    last_page: number;
  };
}

/**
 * Parámetros de filtro para listar documentos
 */
export interface DocumentAttachmentFilters {
  attachable_type?: string;
  attachable_id?: number;
  document_type_id?: number;
  status?: string;
  search?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  per_page?: number;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentAttachmentService {
  private readonly basePath = 'v2/document-attachments';
  private readonly documentTypesPath = 'v2/document-types';
  private documentTypesCache: DocumentType[] | null = null;

  constructor(private http: HttpClient) {}

  // ==================== CATÁLOGO DE TIPOS DE DOCUMENTOS ====================

  /**
   * Obtiene el catálogo de tipos de documentos disponibles
   */
  getDocumentTypes(): Observable<DocumentType[]> {
    if (this.documentTypesCache) {
      return of(this.documentTypesCache);
    }

    return this.http.get<DocumentTypeCatalogResponse>(apiEndpoint(this.documentTypesPath)).pipe(
      map(response => response.data || []),
      tap(data => {
        this.documentTypesCache = data;
      }),
      catchError(error => {
        console.error('Error al cargar tipos de documentos:', error);
        return of([]);
      })
    );
  }

  /**
   * Limpia el caché de tipos de documentos
   */
  clearDocumentTypesCache(): void {
    this.documentTypesCache = null;
  }

  // ==================== CRUD DE DOCUMENTOS ADJUNTOS ====================

  /**
   * Lista documentos adjuntos con filtros opcionales
   */
  list(filters?: DocumentAttachmentFilters): Observable<DocumentAttachment[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.attachable_type) params = params.set('attachable_type', filters.attachable_type);
      if (filters.attachable_id) params = params.set('attachable_id', filters.attachable_id.toString());
      if (filters.document_type_id) params = params.set('document_type_id', filters.document_type_id.toString());
      if (filters.status) params = params.set('status', filters.status);
      if (filters.search) params = params.set('search', filters.search);
      if (filters.sort_by) params = params.set('sort_by', filters.sort_by);
      if (filters.sort_dir) params = params.set('sort_dir', filters.sort_dir);
      if (filters.per_page) params = params.set('per_page', filters.per_page.toString());
    }

    return this.http.get<DocumentAttachmentListResponse>(apiEndpoint(this.basePath), { params }).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Obtiene los documentos adjuntos de una compañía específica
   */
  getByCompany(companyId: number): Observable<DocumentAttachment[]> {
    return this.list({
      attachable_type: 'App\\Models\\Company',
      attachable_id: companyId
    });
  }

  /**
   * Obtiene un documento adjunto por ID
   */
  get(id: number): Observable<DocumentAttachment> {
    return this.http.get<DocumentAttachmentResponse>(apiEndpoint(`${this.basePath}/${id}`)).pipe(
      map(response => response.data)
    );
  }

  /**
   * Crea un nuevo documento adjunto
   */
  create(data: DocumentAttachmentCreateRequest): Observable<DocumentAttachment> {
    return this.http.post<DocumentAttachmentResponse>(apiEndpoint(this.basePath), data).pipe(
      map(response => response.data)
    );
  }

  /**
   * Crea múltiples documentos adjuntos para una compañía
   */
  createMultipleForCompany(companyId: number, documentTypeIds: number[]): Observable<DocumentAttachment[]> {
    const requests = documentTypeIds.map(typeId =>
      this.create({
        document_type_id: typeId,
        attachable_type: 'App\\Models\\Company',
        attachable_id: companyId,
        status: 'incomplete'
      })
    );

    // Ejecutar todas las creaciones en paralelo
    return new Observable(observer => {
      if (requests.length === 0) {
        observer.next([]);
        observer.complete();
        return;
      }

      const results: DocumentAttachment[] = [];
      let completed = 0;
      let hasError = false;

      requests.forEach((request, index) => {
        request.subscribe({
          next: (doc) => {
            results[index] = doc;
            completed++;
            if (completed === requests.length && !hasError) {
              observer.next(results);
              observer.complete();
            }
          },
          error: (err) => {
            if (!hasError) {
              hasError = true;
              observer.error(err);
            }
          }
        });
      });
    });
  }

  /**
   * Actualiza un documento adjunto (PUT)
   */
  update(id: number, data: DocumentAttachmentUpdateRequest): Observable<DocumentAttachment> {
    return this.http.put<DocumentAttachmentResponse>(apiEndpoint(`${this.basePath}/${id}`), data).pipe(
      map(response => response.data)
    );
  }

  /**
   * Actualización parcial de documento adjunto (PATCH)
   */
  patch(id: number, data: Partial<DocumentAttachmentUpdateRequest>): Observable<DocumentAttachment> {
    return this.http.patch<DocumentAttachmentResponse>(apiEndpoint(`${this.basePath}/${id}`), data).pipe(
      map(response => response.data)
    );
  }

  /**
   * Elimina un documento adjunto
   */
  delete(id: number): Observable<{ ok: boolean; message: string }> {
    return this.http.delete<{ ok: boolean; message: string }>(apiEndpoint(`${this.basePath}/${id}`));
  }

  /**
   * Sube un archivo para un documento adjunto
   * Actualiza el documento con la URL del archivo y cambia el status a 'complete'
   */
  uploadFile(documentId: number, fileUrl: string): Observable<DocumentAttachment> {
    return this.patch(documentId, {
      file_url: fileUrl,
      status: 'complete'
    });
  }

  /**
   * Elimina el archivo de un documento adjunto
   * Limpia la URL del archivo y cambia el status a 'incomplete'
   */
  removeFile(documentId: number): Observable<DocumentAttachment> {
    return this.patch(documentId, {
      file_url: null,
      status: 'incomplete'
    });
  }

  // ==================== MÉTODOS DE VALIDACIÓN Y CUMPLIMIENTO ====================

  /**
   * Verifica si todos los documentos requeridos están completos
   */
  checkComplianceStatus(documents: DocumentAttachment[]): boolean {
    if (!documents || documents.length === 0) {
      return false;
    }
    return documents.every(doc => doc.status === 'complete' && doc.file_url);
  }

  /**
   * Obtiene el porcentaje de cumplimiento de documentos
   */
  getCompliancePercentage(documents: DocumentAttachment[]): number {
    if (!documents || documents.length === 0) {
      return 0;
    }
    const completed = documents.filter(doc => doc.status === 'complete' && doc.file_url).length;
    return Math.round((completed / documents.length) * 100);
  }

  /**
   * Verifica el estado de cumplimiento completo de una compañía
   * Incluye: régimen fiscal, uso de CFDI y todos los documentos cargados
   */
  checkFullCompliance(
    company: { tax_regime?: any; tax_preferred_concept?: any },
    documents: DocumentAttachment[]
  ): { isCompliant: boolean; missing: string[] } {
    const missing: string[] = [];

    // Verificar régimen fiscal
    if (!company.tax_regime) {
      missing.push('Régimen fiscal');
    }

    // Verificar uso de CFDI
    if (!company.tax_preferred_concept) {
      missing.push('Uso de CFDI');
    }

    // Verificar todos los documentos
    if (documents && documents.length > 0) {
      const incompleteDocuments = documents.filter(doc => doc.status !== 'complete' || !doc.file_url);
      incompleteDocuments.forEach(doc => {
        missing.push(doc.document_type || `Documento #${doc.document_type_id}`);
      });
    }

    return {
      isCompliant: missing.length === 0,
      missing
    };
  }
}
