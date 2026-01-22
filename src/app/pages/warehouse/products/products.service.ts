import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiEndpoint } from '../../../shared/api-endpoint.util';
import { Product, ProductsListResponse } from './products';

export interface ItemSupplier {
  id: number;
  name: string;
  rfc: string;
  supplier_sku: string | null;
  price: number | null;
  is_preferred: boolean;
  priority: number | null;
  notes: string | null;
}

export interface ItemSuppliersResponse {
  ok: boolean;
  data: ItemSupplier[];
  item: {
    id: number;
    name: string;
    sku: string;
  };
}

export interface QuickSupplierRequest {
  company_name: string;
  rfc?: string;
  email?: string;
  phone?: string;
  price: number;
  supplier_sku?: string;
  is_preferred?: boolean;
  notes?: string;
}

export interface QuickSupplierResponse {
  ok: boolean;
  message: string;
  data: {
    provider: {
      id: number;
      name: string;
      rfc: string;
    };
    supplier: {
      id: number;
      price: number;
      is_preferred: boolean;
    };
  };
}

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  constructor(private http: HttpClient) {}

  getProducts(): Observable<ProductsListResponse> {
    return this.http.get<ProductsListResponse>(apiEndpoint('v2/items'));
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(apiEndpoint(`v2/items/${id}`));
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(apiEndpoint(`v2/items/${id}`));
  }

  /**
   * Obtener los proveedores que venden un item específico con sus precios
   */
  getItemSuppliers(itemId: number): Observable<ItemSuppliersResponse> {
    return this.http.get<ItemSuppliersResponse>(apiEndpoint(`v2/items/${itemId}/suppliers`));
  }

  /**
   * Crear proveedor rápido y asociarlo a un item
   */
  createQuickSupplier(itemId: number, data: QuickSupplierRequest): Observable<QuickSupplierResponse> {
    return this.http.post<QuickSupplierResponse>(apiEndpoint(`v2/items/${itemId}/quick-supplier`), data);
  }
}
