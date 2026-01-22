import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { apiEndpoint } from '../api-endpoint.util';

/**
 * Interfaz para la respuesta de la API de código postal
 */
export interface ZipcodeResponse {
  status: string;
  data: ZipcodeData;
}

/**
 * Datos de la dirección obtenidos por código postal
 */
export interface ZipcodeData {
  pais: string;
  ciudad: string;
  estado: string;
  municipio: string;
  tipo_asentamiento: string[];
  asentamiento: string[];
}

/**
 * Datos procesados para usar en los formularios
 */
export interface ZipcodeFormData {
  country: string;
  city: string;
  state: string;
  municipality: string; // municipio
  county: string; // asentamiento/colonia
  settlementTypes: string[]; // tipos de asentamiento
  settlements: string[]; // colonias/asentamientos
  hasMultipleSettlements: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ZipcodeService {
  private readonly basePath = 'v2/company/direccion';

  constructor(private http: HttpClient) {}

  /**
   * Consulta la información de dirección por código postal
   * @param zipcode Código postal de 5 dígitos
   * @returns Observable con los datos de la dirección
   */
  getAddressByZipcode(zipcode: string): Observable<ZipcodeFormData | null> {
    if (!zipcode || zipcode.length !== 5) {
      return of(null);
    }

    return this.http
      .get<ZipcodeResponse>(apiEndpoint(`${this.basePath}/${zipcode}`))
      .pipe(
        map((response: ZipcodeResponse) => {
          if (response?.status === 'success' && response?.data) {
            const data = response.data;
            console.log('Response de zip code', data);
            return {
              country: data.pais || 'México',
              city: data.ciudad || '',
              state: data.estado || '',
              municipality: data.municipio || '',
              county: data.asentamiento?.[0] || '',
              settlementTypes: data.tipo_asentamiento || [],
              settlements: data.asentamiento || [],
              hasMultipleSettlements: (data.asentamiento?.length || 0) > 1,
            };
          }
          return null;
        }),
        catchError((error) => {
          console.error('Error al consultar código postal:', error);
          return of(null);
        })
      );
  }

  /**
   * Valida si un código postal tiene el formato correcto (5 dígitos)
   * @param zipcode Código postal a validar
   */
  isValidZipcode(zipcode: string): boolean {
    return /^\d{5}$/.test(zipcode);
  }
}
