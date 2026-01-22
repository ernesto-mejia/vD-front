import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

export interface FixedAssetProviderOption {
  id: number;
  name: string;
}

export interface FixedAssetCatalogItem {
  id: number;
  name: string;
  category: string;
  provider_id?: number;
  is_billable?: boolean;
  is_purchasable?: boolean;
}

export type FixedAssetOwnershipType = 'comodato' | 'owned';

export interface FixedAssetInventoryItem {
  id: number;
  internal_code: string;
  name: string;
  location: string;
  category: string;
  serial_number?: string;
  catalog_id?: number;
  ownership_type: FixedAssetOwnershipType;
  comodato_valid_from?: string;
  comodato_valid_until?: string;
  comodato_owner?: string;
  comodato_provider_id?: number;
  comodato_observations?: string;
  plate_id?: string;
  acquisition_date?: string;
  acquisition_value?: number;
  owned_observations?: string;
  maintenance_required?: boolean;
  maintenance_type?: 'preventive' | 'corrective' | '';
  maintenance_date_from?: string;
  maintenance_date_until?: string;
  maintenance_description?: string;
  maintenance_observations?: string;
  accessories?: Array<{ description: string; quantity: number | null }>;
}

@Injectable({
  providedIn: 'root',
})
export class FixedAssetsService {
  private readonly categories = [
    'Microscopio',
    'Centrifuga',
    'Computo',
    'Equipo analizador',
    'Instrumento',
    'Mobiliario',
    'Vehiculos',
  ];

  private readonly providers: FixedAssetProviderOption[] = [
    { id: 1, name: 'Proveedor Alfa' },
    { id: 2, name: 'Proveedor Beta' },
    { id: 3, name: 'Proveedor Gamma' },
  ];

  private catalogItems: FixedAssetCatalogItem[] = [
    {
      id: 1,
      name: 'Microscopio Optico',
      category: 'Microscopio',
      provider_id: 1,
      is_billable: true,
      is_purchasable: true,
    },
    {
      id: 2,
      name: 'Centrifuga 3000',
      category: 'Centrifuga',
      provider_id: 2,
      is_billable: false,
      is_purchasable: true,
    },
  ];

  private inventoryItems: FixedAssetInventoryItem[] = [
    {
      id: 1,
      internal_code: 'AF-001',
      name: 'Microscopio Optico',
      location: 'Laboratorio Central',
      category: 'Microscopio',
      serial_number: 'MS-2024-0001',
      catalog_id: 1,
      ownership_type: 'owned',
      plate_id: 'MX-2024-001',
      acquisition_date: '2024-04-10',
      acquisition_value: 35000,
      owned_observations: 'Equipo calibrado en sitio.',
      maintenance_required: true,
      maintenance_type: 'preventive',
      maintenance_date_from: '2024-10-01',
      maintenance_date_until: '2024-12-01',
      maintenance_description: 'Mantenimiento preventivo semestral.',
      maintenance_observations: 'Sin incidencias.',
      accessories: [
        { description: 'Microscopio ocular', quantity: 2 },
        { description: 'Fuente de poder', quantity: 1 },
      ],
    },
    {
      id: 2,
      internal_code: 'AF-002',
      name: 'Centrifuga 3000',
      location: 'Sucursal Norte',
      category: 'Centrifuga',
      serial_number: 'CF-2023-099',
      catalog_id: 2,
      ownership_type: 'comodato',
      comodato_valid_from: '2025-01-01',
      comodato_valid_until: '2025-12-31',
      comodato_owner: 'Proveedor Beta',
      comodato_provider_id: 2,
      comodato_observations: 'Comodato con renovación anual.',
      maintenance_required: false,
      maintenance_type: '',
      maintenance_date_from: '',
      maintenance_date_until: '',
      accessories: [{ description: 'Tapa de seguridad', quantity: 1 }],
    },
  ];

  private nextCatalogId = 3;
  private nextInventoryId = 3;

  getCategories(): Observable<string[]> {
    return of([...this.categories]).pipe(delay(100));
  }

  getProvidersCatalog(): Observable<FixedAssetProviderOption[]> {
    return of([...this.providers]).pipe(delay(100));
  }

  getCatalog(): Observable<FixedAssetCatalogItem[]> {
    return of([...this.catalogItems]).pipe(delay(200));
  }

  getCatalogItem(id: number): Observable<FixedAssetCatalogItem | null> {
    const item = this.catalogItems.find((entry) => entry.id === id) || null;
    return of(item ? { ...item } : null).pipe(delay(150));
  }

  createCatalog(payload: FixedAssetCatalogItem): Observable<FixedAssetCatalogItem> {
    const newItem: FixedAssetCatalogItem = {
      ...payload,
      id: this.nextCatalogId++,
    };
    this.catalogItems.push(newItem);
    return of({ ...newItem }).pipe(delay(200));
  }

  updateCatalog(id: number, payload: FixedAssetCatalogItem): Observable<FixedAssetCatalogItem | null> {
    const index = this.catalogItems.findIndex((entry) => entry.id === id);
    if (index === -1) {
      return of(null).pipe(delay(150));
    }
    this.catalogItems[index] = {
      ...this.catalogItems[index],
      ...payload,
      id,
    };
    return of({ ...this.catalogItems[index] }).pipe(delay(200));
  }

  deleteCatalog(id: number): Observable<boolean> {
    const index = this.catalogItems.findIndex((entry) => entry.id === id);
    if (index === -1) {
      return of(false).pipe(delay(150));
    }
    this.catalogItems.splice(index, 1);
    return of(true).pipe(delay(150));
  }

  getInventory(): Observable<FixedAssetInventoryItem[]> {
    return of([...this.inventoryItems]).pipe(delay(200));
  }

  getInventoryItem(id: number): Observable<FixedAssetInventoryItem | null> {
    const item = this.inventoryItems.find((entry) => entry.id === id) || null;
    return of(item ? { ...item } : null).pipe(delay(150));
  }

  createInventory(payload: FixedAssetInventoryItem): Observable<FixedAssetInventoryItem> {
    const newItem: FixedAssetInventoryItem = {
      ...payload,
      id: this.nextInventoryId++,
    };
    this.inventoryItems.push(newItem);
    return of({ ...newItem }).pipe(delay(200));
  }

  updateInventory(id: number, payload: FixedAssetInventoryItem): Observable<FixedAssetInventoryItem | null> {
    const index = this.inventoryItems.findIndex((entry) => entry.id === id);
    if (index === -1) {
      return of(null).pipe(delay(150));
    }
    this.inventoryItems[index] = {
      ...this.inventoryItems[index],
      ...payload,
      id,
    };
    return of({ ...this.inventoryItems[index] }).pipe(delay(200));
  }

  deleteInventory(id: number): Observable<boolean> {
    const index = this.inventoryItems.findIndex((entry) => entry.id === id);
    if (index === -1) {
      return of(false).pipe(delay(150));
    }
    this.inventoryItems.splice(index, 1);
    return of(true).pipe(delay(150));
  }

  getProviderName(providerId?: number): string {
    if (!providerId) return '-';
    const provider = this.providers.find((item) => item.id === providerId);
    return provider?.name ?? `Proveedor #${providerId}`;
  }

  getCatalogName(catalogId?: number): string {
    if (!catalogId) return '-';
    const item = this.catalogItems.find((entry) => entry.id === catalogId);
    return item?.name ?? `Catalogo #${catalogId}`;
  }
}
