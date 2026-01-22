import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

export type EntryNoteStatus = 'pending' | 'completed';

export interface EntryNoteItem {
  id: number;
  product_id: number;
  name: string;
  qty: number;
  storage_type: string;
  gtin?: string;
  ref?: string;
  lot?: string;
  expiration_date?: string;
  manufacture_date?: string;
  scanned_qty?: number;
  catalog_number?: string;
  observation?: string;
}

export interface EntryNote {
  id: number;
  purchase_order_code: string;
  provider_id: number;
  provider_name: string;
  estimated_delivery: string;
  status: EntryNoteStatus;
  items: EntryNoteItem[];
  created_at?: string;
  completed_at?: string | null;
  completion_status?: 'complete' | 'incomplete';
}

export interface CatalogProduct {
  id: number;
  name: string;
  gtin?: string;
  storage_type: string;
}

@Injectable({
  providedIn: 'root',
})
export class EntryNotesService {
  private entryNotes: EntryNote[] = [
    {
      id: 1,
      purchase_order_code: 'OC-2025-001',
      provider_id: 7,
      provider_name: 'Proveedor X',
      estimated_delivery: '2025-02-03',
      status: 'pending',
      created_at: '2025-01-28',
      completed_at: null,
      items: [
        {
          id: 101,
          product_id: 501,
          name: 'Reactivo Glucosa',
          qty: 1000,
          storage_type: 'Refrigerado',
          gtin: '7501234567890',
          ref: 'REF-GLU-01',
          scanned_qty: 0,
          catalog_number: 'CAT-501-GLU',
        },
        {
          id: 102,
          product_id: 502,
          name: 'Kit Hemograma',
          qty: 200,
          storage_type: 'Ambiente',
          gtin: '7501234567000',
          ref: 'REF-HEM-02',
          scanned_qty: 0,
          catalog_number: 'CAT-502-HEM',
        },
      ],
    },
    {
      id: 2,
      purchase_order_code: 'OC-2025-002',
      provider_id: 12,
      provider_name: 'Proveedor Beta',
      estimated_delivery: '2025-02-05',
      status: 'pending',
      created_at: '2025-01-29',
      completed_at: null,
      items: [
        {
          id: 201,
          product_id: 503,
          name: 'Tubo Vacutainer',
          qty: 500,
          storage_type: 'Ambiente',
          gtin: '7501234567999',
          ref: 'REF-VAC-03',
          scanned_qty: 0,
        },
        {
          id: 202,
          product_id: 504,
          name: 'Reactivo PCR',
          qty: 120,
          storage_type: 'Congelado',
          gtin: '7501234567888',
          ref: 'REF-PCR-04',
          scanned_qty: 0,
        },
      ],
    },
    {
      id: 3,
      purchase_order_code: 'OC-2025-000',
      provider_id: 15,
      provider_name: 'Proveedor Gamma',
      estimated_delivery: '2025-01-20',
      status: 'completed',
      created_at: '2025-01-10',
      completed_at: '2025-01-20',
      items: [
        {
          id: 301,
          product_id: 505,
          name: 'Guantes de Nitrilo',
          qty: 300,
          storage_type: 'Ambiente',
          gtin: '7501234567555',
          ref: 'REF-GUA-05',
          scanned_qty: 300,
        },
      ],
    },
  ];

  private catalogProducts: CatalogProduct[] = [
    {
      id: 501,
      name: 'Reactivo Glucosa',
      gtin: '7501234567890',
      storage_type: 'Refrigerado',
    },
    {
      id: 502,
      name: 'Kit Hemograma',
      gtin: '7501234567000',
      storage_type: 'Ambiente',
    },
    {
      id: 503,
      name: 'Tubo Vacutainer',
      gtin: '7501234567999',
      storage_type: 'Ambiente',
    },
    {
      id: 504,
      name: 'Reactivo PCR',
      gtin: '7501234567888',
      storage_type: 'Congelado',
    },
    {
      id: 600,
      name: 'Producto Fuera de Orden',
      gtin: '7500000000000',
      storage_type: 'Ambiente',
    },
  ];

  getEntryNotes(): Observable<EntryNote[]> {
    return of(this.entryNotes.map((note) => ({ ...note }))).pipe(delay(150));
  }

  getEntryNote(id: number): Observable<EntryNote | null> {
    const note = this.entryNotes.find((entry) => entry.id === id) || null;
    return of(note ? { ...note, items: note.items.map((item) => ({ ...item })) } : null).pipe(
      delay(150)
    );
  }

  updateEntryNote(updated: EntryNote): Observable<EntryNote> {
    const index = this.entryNotes.findIndex((entry) => entry.id === updated.id);
    if (index !== -1) {
      this.entryNotes[index] = {
        ...updated,
        items: updated.items.map((item) => ({ ...item })),
      };
    }
    return of({ ...updated }).pipe(delay(100));
  }

  findProductByGtin(gtin: string): CatalogProduct | null {
    return this.catalogProducts.find((product) => product.gtin === gtin) || null;
  }
}
