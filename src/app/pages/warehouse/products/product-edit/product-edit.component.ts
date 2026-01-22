import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import Swal from 'sweetalert2';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import { apiEndpoint } from '../../../../shared/api-endpoint.util';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-product-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './product-edit.component.html',
  styleUrl: './product-edit.component.css',
})
export class ProductEditComponent implements OnInit {
  formSubmitted = false;
  itemId!: number;

  product: any = {
    name: '',
    sku: '',
    item_status_id: null,
    product_type_id: null,
    presentation_id: null,
    inventory_unit_of_measurement_id: null,
    purchase_unit_of_measurement_id: null,
    unit_equivalence: 0,
    storage_condition_id: null,
    physical_spec: {
      height: null,
      width: null,
      length: null,
      weight: null,
    },
    configuration: {
      requires_lot: false,
      requires_expiration_date: false,
      requires_manufacture_date: false,
      requires_invoice: false,
      relates_to_other_products: false,
    },
  };

  inventoryStatuses: any[] = [];
  productTypes: any[] = [];
  unitsOfMeasurement: any[] = [];
  storageConditions: any[] = [];
  providersCatalog: any[] = [];
  providers: any[] = [];
  equipmentsCatalog: any[] = [];
  equipments: Array<{
    equipment_id: number | null;
    tests_per_equipment: number | null;
  }> = [];
  itemsCatalog: Array<{ id: number; name: string }> = [];
  remplazos: Array<{
    id_replacement: number | null;
    replacement_item_id: number | null;
    provider_id: number | null;
    observations: string;
    search: string;
    provider_name: string;
    provider_code: string;
    options: Array<{ id: number; name: string; provider_code?: string }>;
  }> = [];
  equivalencias: Array<{
    replacement_item_id: number | null;
    name: string;
    search: string;
    observations: string;
    providers: any[];
  }> = [];
  relatedProducts: Array<{
    item_id: number | null;
    name: string;
    search: string;
  }> = [];
  expandedEquivalencias = new Set<number>();
  presentationInput = '';
  presentationOptions: Array<{ id: number; label: string }> = [];
  private presentationSearchTimeout: any = null;

  getFilteredPresentationOptions(): Array<{ id: number; label: string }> {
    const value = this.presentationInput.trim().toLowerCase();
    if (!value) {
      return this.presentationOptions;
    }

    return this.presentationOptions.filter((option) =>
      option.label.toLowerCase().includes(value)
    );
  }

  addPresentationOption(): void {
    const value = this.presentationInput.trim();
    if (!value) {
      return;
    }

    this.http
      .post<any>(apiEndpoint('v2/product-presentations'), {
        name: value.toUpperCase(),
      })
      .subscribe({
        next: (resp) => {
          const data = resp?.data || resp;
          const option = {
            id: data?.id ?? null,
            label: data?.name ?? value.toUpperCase(),
          };
          if (option.id !== null) {
            this.presentationOptions = [option, ...this.presentationOptions];
            this.selectPresentationOption(option);
          }
        },
        error: (err: HttpErrorResponse) =>
          console.error('Error al crear presentacion:', err),
      });
  }

  selectPresentationOption(option: { id: number; label: string }): void {
    this.presentationInput = option.label;
    this.product.presentation_id = option.id;
  }

  searchPresentations(): void {
    const value = this.presentationInput.trim();
    if (this.presentationSearchTimeout) {
      clearTimeout(this.presentationSearchTimeout);
    }

    this.presentationSearchTimeout = setTimeout(() => {
      this.http
        .get<any>(
          apiEndpoint(
            `v2/product-presentations?search=${encodeURIComponent(value)}`
          )
        )
        .subscribe({
          next: (resp) => {
            const items = resp?.data || resp || [];
            this.presentationOptions = items.map((item: any) => ({
              id: item.id,
              label: item.name || String(item.id),
            }));
          },
          error: (err: HttpErrorResponse) =>
            console.error('Error al buscar presentaciones:', err),
        });
    }, 250);
  }

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.itemId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadCatalogs();
    this.loadItem();
  }

  private loadCatalogs(): void {
    this.loadInventoryStatuses();
    this.loadProductTypes();
    this.loadUnitsOfMeasurement();
    this.loadStorageConditions();
    this.loadProvidersCatalog();
    this.loadEquipmentsCatalog();
    this.loadItemsCatalog();
  }

  private loadInventoryStatuses(): void {
    this.http.get<any>(apiEndpoint('inventory_status/list')).subscribe({
      next: (resp) => (this.inventoryStatuses = resp?.data || resp || []),
      error: (err: HttpErrorResponse) =>
        console.error('Error al cargar estatus de inventario:', err),
    });
  }

  private loadProductTypes(): void {
    this.http.get<any>(apiEndpoint('v2/product-types')).subscribe({
      next: (resp) => {
        this.productTypes = resp?.data || resp || [];
      },
      error: (err: HttpErrorResponse) =>
        console.error('Error al cargar tipos de producto:', err),
    });
  }

  private loadUnitsOfMeasurement(): void {
    this.http.get<any>(apiEndpoint('unit_measurement/list')).subscribe({
      next: (resp) => (this.unitsOfMeasurement = resp?.data || resp || []),
      error: (err: HttpErrorResponse) =>
        console.error('Error al cargar unidades de medida:', err),
    });
  }

  private loadStorageConditions(): void {
    this.http.get<any>(apiEndpoint('story_types/list')).subscribe({
      next: (resp) => (this.storageConditions = resp?.data || resp || []),
      error: (err: HttpErrorResponse) =>
        console.error('Error al cargar tipos de almacenamiento:', err),
    });
  }

  private loadProvidersCatalog(): void {
    this.http.get<any>(apiEndpoint('v2/company/providers')).subscribe({
      next: (resp) => (this.providersCatalog = resp?.data || resp || []),
      error: (err: HttpErrorResponse) =>
        console.error('Error al cargar catalogo de proveedores:', err),
    });
  }

  private loadEquipmentsCatalog(): void {
    this.http
      .get<any>(apiEndpoint('v2/equipments/medical-test-supplies'))
      .subscribe({
        next: (resp) => (this.equipmentsCatalog = resp?.data || resp || []),
        error: (err: HttpErrorResponse) =>
          console.error('Error al cargar catalogo de equipos:', err),
      });
  }

  private loadItemsCatalog(): void {
    this.http.get<any>(apiEndpoint('v2/items')).subscribe({
      next: (resp) => {
        const items = resp?.data || resp || [];
        this.itemsCatalog = items
          .filter((item: any) => item?.id !== this.itemId)
          .map((item: any) => {
            const baseName = item.name || item.sku || String(item.id);
            const primaryProvider =
              item.providers?.find((prov: any) => prov.is_primary) ||
              item.primary_provider ||
              item.providers?.[0] ||
              null;
            const catalogCode =
              primaryProvider?.provider_code ||
              item.primary_provider_code ||
              item.provider_code ||
              '';
            return {
              id: item.id,
              name: catalogCode ? `${baseName} - #${catalogCode}` : baseName,
            };
          });
      },
      error: (err: HttpErrorResponse) =>
        console.error('Error al cargar catalogo de items:', err),
    });
  }

  addProvider(): void {
    this.providers.push({
      provider_id: null,
      item_provider_code_id: null,
      name: null,
      shortname: null,
      company: null,
      provider_code: '',
      ref: '',
      provider_sku: null,
      is_active: true,
      is_primary: false,
      valid_from: null,
      valid_until: null,
      meta: {
        notes: '',
      },
      _original_item_provider_code_id: null,
    });
  }

  setPrimaryProvider(index: number): void {
    this.providers = this.providers.map((provider, i) => ({
      ...provider,
      is_primary: i === index,
    }));
  }

  removeProvider(index: number): void {
    Swal.fire({
      title: '¿Eliminar proveedor?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.providers.splice(index, 1);
      }
    });
  }

  onProviderChange(index: number): void {
    const provider = this.providers[index];
    if (!provider) {
      return;
    }
    const match = this.providersCatalog.find(
      (item: any) => item.id === provider.provider_id
    );
    provider.name = match?.name ?? null;
    provider.shortname = match?.shortname ?? null;
    provider.company = match?.company ?? null;
  }

  onProviderCodeChange(index: number): void {
    const provider = this.providers[index];
    if (!provider) {
      return;
    }
    const newCode = (provider.provider_code || '').trim();
    const currentRef = (provider.ref || '').trim();
    if (!currentRef) {
      provider.ref = newCode;
    }
  }

  getProviderDisplayName(provider: any): string {
    if (!provider) {
      return '-';
    }
    return (
      provider.shortname ||
      provider.name ||
      provider.company ||
      this.getProviderLabel(provider.provider_id) ||
      '-'
    );
  }

  addEquipment(): void {
    this.equipments.push({
      equipment_id: null,
      tests_per_equipment: null,
    });
  }

  removeEquipment(index: number): void {
    this.equipments.splice(index, 1);
  }

  addRemplazo(): void {
    const defaultProviderId = this.getDefaultProviderId();
    this.remplazos.push({
      id_replacement: null,
      replacement_item_id: null,
      provider_id: defaultProviderId,
      observations: '',
      search: '',
      provider_name: this.getProviderLabel(defaultProviderId),
      provider_code: '',
      options: [],
    });
  }

  removeRemplazo(index: number): void {
    this.remplazos.splice(index, 1);
  }

  onRemplazoProviderChange(index: number): void {
    const target = this.remplazos[index];
    if (!target) {
      return;
    }
    target.replacement_item_id = null;
    target.search = '';
    target.provider_code = '';
    target.options = [];
    target.provider_name = this.getProviderLabel(target.provider_id);
  }

  searchRemplazoItems(index: number): void {
    const target = this.remplazos[index];
    if (!target || !target.provider_id) {
      return;
    }

    const search = target.search.trim();
    if (!search) {
      target.options = [];
      return;
    }
    const url = apiEndpoint(
      `v2/items/${this.itemId}/replacements/search?provider_id=${
        target.provider_id
      }&search=${encodeURIComponent(search)}`
    );

    this.http.get<any>(url).subscribe({
      next: (resp) => {
        const items = resp?.data || resp || [];
        target.options = items.map((item: any) => {
          const baseName =
            item.item_name ||
            item.name ||
            item.sku ||
            String(item.item_id ?? item.id);
          const catalogCode = item.provider_code || item.catalog_number || '';
          return {
            id: item.item_id ?? item.id,
            name: catalogCode ? `${baseName} - #${catalogCode}` : baseName,
            provider_code: catalogCode,
          };
        });
      },
      error: (err: HttpErrorResponse) =>
        console.error('Error al buscar remplazos:', err),
    });
  }

  getFilteredRemplazoOptions(
    index: number
  ): Array<{ id: number; name: string; provider_code?: string }> {
    const target = this.remplazos[index];
    if (!target) {
      return [];
    }
    const value = target.search.trim().toLowerCase();
    if (!value) {
      return target.options;
    }
    return target.options.filter((option) =>
      option.name.toLowerCase().includes(value)
    );
  }

  selectRemplazoItem(
    index: number,
    item: { id: number; name: string; provider_code?: string }
  ): void {
    const target = this.remplazos[index];
    if (!target) {
      return;
    }
    target.replacement_item_id = item.id;
    target.search = item.name;
    target.provider_code = item.provider_code || '';
    target.provider_name = this.getProviderLabel(target.provider_id);
  }

  resolveRemplazoSelection(index: number): void {
    const target = this.remplazos[index];
    if (!target || !target.search.trim()) {
      return;
    }
    const match = this.getFilteredRemplazoOptions(index).find(
      (item) => item.name.toLowerCase() === target.search.trim().toLowerCase()
    );
    if (match) {
      this.selectRemplazoItem(index, match);
    }
  }

  getFilteredItemOptions(search: string): Array<{ id: number; name: string }> {
    const value = search.trim().toLowerCase();
    if (!value) {
      return this.itemsCatalog;
    }
    return this.itemsCatalog.filter((item) =>
      item.name.toLowerCase().includes(value)
    );
  }

  resolveEquivalenciaSelection(index: number): void {
    const target = this.equivalencias[index];
    if (!target || !target.search.trim()) {
      return;
    }
    const match = this.getFilteredItemOptions(target.search).find(
      (item) => item.name.toLowerCase() === target.search.trim().toLowerCase()
    );
    if (match) {
      this.selectEquivalenciaItem(index, match);
    }
  }

  private getProviderLabel(providerId: number | null): string {
    if (!providerId) {
      return '';
    }
    const provider = this.providersCatalog.find(
      (item: any) => item.id === providerId
    );
    return provider?.name || provider?.shortname || provider?.company || '';
  }

  private getDefaultProviderId(): number | null {
    const primary =
      this.providers.find((provider: any) => provider.is_primary) || null;
    if (primary?.provider_id) {
      return primary.provider_id;
    }
    const active =
      this.providers.find((provider: any) => provider.is_active) || null;
    if (active?.provider_id) {
      return active.provider_id;
    }
    return this.providers[0]?.provider_id ?? null;
  }

  getDefaultProviderLabel(): string {
    return this.getProviderLabel(this.getDefaultProviderId()) || '-';
  }

  addEquivalencia(): void {
    this.equivalencias.push({
      replacement_item_id: null,
      name: '',
      search: '',
      observations: '',
      providers: [],
    });
  }

  removeEquivalencia(index: number): void {
    this.equivalencias.splice(index, 1);
    this.expandedEquivalencias.delete(index);
  }

  addRelatedProduct(): void {
    if (this.relatedProducts.some((rel) => !rel.item_id && !rel.search.trim())) {
      Swal.fire('Info', 'Ya tienes una fila pendiente de selección.', 'info');
      return;
    }
    this.relatedProducts.push({
      item_id: null,
      name: '',
      search: '',
    });
  }

  removeRelatedProduct(index: number): void {
    this.relatedProducts.splice(index, 1);
  }

  selectRelatedProduct(
    index: number,
    item: { id: number; name: string }
  ): void {
    const target = this.relatedProducts[index];
    if (!target) {
      return;
    }
    if (this.relatedProducts.some((rel, i) => i !== index && rel.item_id === item.id)) {
      Swal.fire('Info', 'Ese producto ya está agregado.', 'info');
      return;
    }
    target.item_id = item.id;
    target.name = item.name;
    target.search = item.name;
  }

  resolveRelatedProductSelection(index: number): void {
    const target = this.relatedProducts[index];
    if (!target || !target.search.trim()) {
      return;
    }
    const match = this.getFilteredItemOptions(target.search).find(
      (item) => item.name.toLowerCase() === target.search.trim().toLowerCase()
    );
    if (match) {
      this.selectRelatedProduct(index, match);
    }
  }

  saveRelatedProducts(): void {
    const payload = {
      related_item_ids: this.relatedProducts
        .filter((rel) => rel.item_id)
        .map((rel) => rel.item_id),
    };
    const headers = this.buildAuthHeaders();

    Swal.fire({
      title: 'Actualizando productos relacionados...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    this.http
      .put(apiEndpoint(`v2/items/${this.itemId}/related-products`), payload, {
        headers,
      })
      .subscribe({
        next: () => {
          Swal.close();
          Swal.fire(
            'Éxito',
            'Productos relacionados actualizados correctamente',
            'success'
          );
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error al actualizar productos relacionados:', error);
          Swal.close();
          Swal.fire(
            'Error',
            'No se pudo actualizar productos relacionados.',
            'error'
          );
        },
      });
  }

  hasRelatedProducts(): boolean {
    return this.relatedProducts.some((rel) => !!rel.item_id);
  }

  toggleEquivalencia(index: number): void {
    if (this.expandedEquivalencias.has(index)) {
      this.expandedEquivalencias.delete(index);
    } else {
      this.expandedEquivalencias.add(index);
    }
  }

  selectEquivalenciaItem(
    index: number,
    item: { id: number; name: string }
  ): void {
    const target = this.equivalencias[index];
    if (!target) {
      return;
    }

    target.replacement_item_id = item.id;
    target.name = item.name;
    target.search = item.name;
    target.observations = '';
    target.providers = [];

    this.http.get<any>(apiEndpoint(`v2/items/${item.id}`)).subscribe({
      next: (resp) => {
        const data = resp?.data || resp;
        target.providers = data?.providers || [];
        this.expandedEquivalencias.add(index);
      },
      error: (err: HttpErrorResponse) =>
        console.error('Error al cargar item de equivalencia:', err),
    });
  }

  syncPresentationOption(): void {
    const value = this.presentationInput.trim();
    if (!value) {
      this.product.presentation_id = null;
      return;
    }

    const match = this.presentationOptions.find(
      (option) => option.label.toLowerCase() === value.toLowerCase()
    );
    if (match) {
      this.product.presentation_id = match.id;
    } else {
      this.product.presentation_id = null;
    }
  }

  private loadItem(): void {
    Swal.fire({
      title: 'Cargando producto...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    this.http.get<any>(apiEndpoint(`v2/items/${this.itemId}`)).subscribe({
      next: (resp) => {
        Swal.close();
        const data = resp?.data || resp;
        this.product = {
          name: data.name,
          sku: data.sku || '',
          item_status_id: data.item_status_id,
          product_type_id:
            data.product_type_id ?? data.product_type?.id ?? null,
          presentation_id:
            data.presentation_id ??
            data.product_presentation_id ??
            data.product_presentation?.id ??
            null,
          inventory_unit_of_measurement_id:
            data.inventory_unit_of_measurement_id,
          purchase_unit_of_measurement_id: data.purchase_unit_of_measurement_id,
          unit_equivalence: data.unit_equivalence ?? 0,
          storage_condition_id: data.storage_condition_id,
          physical_spec: {
            width:
              data.physical_spec?.width ?? data.dimensions?.width_cm ?? null,
            height:
              data.physical_spec?.height ?? data.dimensions?.height_cm ?? null,
            length:
              data.physical_spec?.length ?? data.dimensions?.length_cm ?? null,
            weight:
              data.physical_spec?.weight ?? data.dimensions?.weight_kg ?? null,
          },
          configuration: {
            requires_lot: data.configuration?.requires_lot ?? false,
            requires_expiration_date:
              data.configuration?.requires_expiration_date ?? false,
            requires_manufacture_date:
              data.configuration?.requires_manufacture_date ?? false,
            requires_invoice:
              data.configuration?.requires_invoice ??
              data.configuration?.is_invoice ??
              false,
            relates_to_other_products:
              data.configuration?.relates_to_other_products ??
              data.configuration?.is_relationship_items ??
              false,
          },
        };
        const presentationName =
          data.presentation ?? data.product_presentation?.name ?? '';
        if (data.product_presentation?.id && data.product_presentation?.name) {
          const option = {
            id: data.product_presentation.id,
            label: data.product_presentation.name,
          };
          this.presentationOptions = [
            option,
            ...this.presentationOptions.filter((opt) => opt.id !== option.id),
          ];
        }
        const presentationOption = this.presentationOptions.find(
          (option) => option.id === this.product.presentation_id
        );
        this.presentationInput =
          presentationOption?.label || presentationName || '';
        this.providers = (data.providers || []).map((provider: any) => ({
          provider_id: provider.provider_id ?? provider.id ?? null,
          item_provider_code_id: provider.item_provider_code_id ?? null,
          name: provider.name ?? null,
          shortname: provider.shortname ?? null,
          company: provider.company ?? null,
          provider_code: provider.provider_code ?? '',
          ref:
            provider.ref ??
            provider.provider_ref ??
            provider.reference ??
            provider.provider_code ??
            '',
          provider_sku: provider.provider_sku ?? null,
          is_active: provider.is_active ?? true,
          is_primary: provider.is_primary ?? false,
          valid_from: provider.valid_from ?? null,
          valid_until: provider.valid_until ?? null,
          meta: {
            notes: provider.meta?.notes ?? '',
          },
          _original_item_provider_code_id:
            provider.item_provider_code_id ?? null,
        }));
        const defaultProviderId = this.getDefaultProviderId();
        this.remplazos = (data.remplazos || data.replacements || []).map(
          (rem: any) => {
            const name =
              rem.name ||
              rem.item?.name ||
              rem.replacement_item?.name ||
              rem.replacement_item_name ||
              rem.item_name ||
              rem.sku ||
              String(rem.replacement_item_id || rem.item_id || rem.id || '');
            const provider =
              rem.provider ||
              rem.primary_provider ||
              rem.providers?.find((p: any) => p.is_primary) ||
              rem.providers?.[0] ||
              null;
            const providerId =
              rem.provider_id ?? provider?.id ?? defaultProviderId ?? null;
            return {
              id_replacement:
                rem.id_replacement ?? rem.replacement_id ?? rem.id ?? null,
              replacement_item_id:
                rem.replacement_item_id ?? rem.item_id ?? rem.id ?? null,
              provider_id: providerId,
              observations: rem.observations ?? '',
              search: name,
              provider_name:
                provider?.shortname ||
                provider?.name ||
                provider?.company ||
                this.getProviderLabel(providerId),
              provider_code: rem.provider_code || provider?.provider_code || '',
              options: [],
            };
          }
        );
        this.equivalencias = (data.equivalencias || data.equivalents || []).map(
          (eq: any) => {
            const name =
              eq.name ||
              eq.item?.name ||
              eq.replacement_item?.name ||
              eq.replacement_item_name ||
              eq.item_name ||
              eq.sku ||
              String(eq.replacement_item_id || eq.item_id || eq.id || '');
            return {
              replacement_item_id:
                eq.replacement_item_id ?? eq.item_id ?? eq.id ?? null,
              name,
              search: name,
              observations: eq.observations ?? '',
              providers: eq.providers || [],
            };
          }
        );
        this.relatedProducts = (data.related_products || []).map((rel: any) => {
          const name = rel.name || rel.sku || String(rel.id ?? '');
          return {
            item_id: rel.id ?? null,
            name,
            search: name,
          };
        });
        this.equipments = (data.equipments || []).map((eq: any) => ({
          equipment_id: eq.equipment_id ?? eq.id ?? null,
          tests_per_equipment: eq.tests_per_equipment ?? eq.test_count ?? null,
        }));
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error al cargar el producto:', error);
        Swal.close();
        Swal.fire(
          'Error',
          'No se pudo cargar la información del producto.',
          'error'
        ).then(() => {
          this.router.navigate(['/products/list']);
        });
      },
    });
  }

  validateRequiredFields(): boolean {
    return !!this.product.name && !!this.product.product_type_id;
  }

  private buildAuthHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    const token = localStorage.getItem('authToken');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  saveGeneral(): void {
    this.formSubmitted = true;

    if (!this.validateRequiredFields()) {
      return;
    }

    const payload = {
      name: this.product.name,
      item_status_id: this.product.item_status_id,
      product_type_id: this.product.product_type_id,
      product_presentation_id: this.product.presentation_id,
      inventory_unit_of_measurement_id:
        this.product.inventory_unit_of_measurement_id,
      purchase_unit_of_measurement_id:
        this.product.purchase_unit_of_measurement_id,
      unit_equivalence: this.product.unit_equivalence ?? 0,
      storage_condition_id: this.product.storage_condition_id,
    };

    const headers = this.buildAuthHeaders();

    Swal.fire({
      title: 'Actualizando datos generales...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    this.http
      .put(apiEndpoint(`v2/items/${this.itemId}`), payload, { headers })
      .subscribe({
        next: () => {
          Swal.close();
          Swal.fire(
            'Éxito',
            'Datos generales actualizados correctamente',
            'success'
          );
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error al actualizar datos generales:', error);
          Swal.close();
          Swal.fire(
            'Error',
            'No se pudo actualizar los datos generales. Intente nuevamente.',
            'error'
          );
        },
      });
  }

  saveProduct(): void {
    this.saveGeneral();
  }

  saveProviders(): void {
    const payload = {
      providers: this.providers
        .filter((provider) => provider.provider_id && provider.provider_code)
        .map((provider) => {
          const refValue = (provider.ref || '').trim() || provider.provider_code;
          const base: any = {
            provider_id: provider.provider_id,
            provider_code: provider.provider_code,
            is_active: provider.is_active ?? true,
            is_primary: provider.is_primary ?? false,
          };
          if (refValue) {
            base.ref = refValue;
          }
          if (
            provider.provider_sku !== null &&
            provider.provider_sku !== undefined
          ) {
            base.provider_sku = provider.provider_sku;
          }
          if (provider.valid_from) {
            base.valid_from = provider.valid_from;
          }
          if (provider.valid_until) {
            base.valid_until = provider.valid_until;
          }
          if (provider.meta?.notes !== undefined) {
            base.meta = { notes: provider.meta?.notes ?? '' };
          }
          return base;
        }),
    };

    if (!payload.providers.length) {
      Swal.fire('Info', 'No hay proveedores para actualizar.', 'info');
      return;
    }

    const headers = this.buildAuthHeaders();
    Swal.fire({
      title: 'Actualizando proveedores...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    this.http
      .put(apiEndpoint(`v2/items/${this.itemId}/providers/sync`), payload, {
        headers,
      })
      .subscribe({
        next: () => {
          Swal.close();
          Swal.fire(
            'Éxito',
            'Proveedores actualizados correctamente',
            'success'
          );
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error al actualizar proveedores:', error);
          Swal.close();
          Swal.fire('Error', 'No se pudo actualizar proveedores.', 'error');
        },
      });
  }

  saveDimensions(): void {
    const payload = {
      height: this.product.physical_spec?.height ?? null,
      width: this.product.physical_spec?.width ?? null,
      length: this.product.physical_spec?.length ?? null,
      weight: this.product.physical_spec?.weight ?? null,
      volume: 0,
    };
    const headers = this.buildAuthHeaders();

    Swal.fire({
      title: 'Actualizando dimensiones...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    this.http
      .put(apiEndpoint(`v2/items/${this.itemId}/physical-spec`), payload, {
        headers,
      })
      .subscribe({
        next: () => {
          Swal.close();
          Swal.fire(
            'Éxito',
            'Dimensiones y peso actualizados correctamente',
            'success'
          );
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error al actualizar dimensiones:', error);
          Swal.close();
          Swal.fire(
            'Error',
            'No se pudo actualizar dimensiones y peso.',
            'error'
          );
        },
      });
  }

  saveEquipments(): void {
    const payloads = this.equipments
      .filter((eq) => eq.equipment_id)
      .map((eq) => ({
        equipment_id: eq.equipment_id,
        tests_per_equipment: eq.tests_per_equipment ?? 0,
      }));
    if (!payloads.length) {
      Swal.fire('Info', 'No hay equipos para actualizar.', 'info');
      return;
    }

    const headers = this.buildAuthHeaders();
    const requests = payloads.map((payload) =>
      this.http.post(
        apiEndpoint(`v2/items/${this.itemId}/equipments`),
        payload,
        { headers }
      )
    );

    Swal.fire({
      title: 'Actualizando equipos...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    forkJoin(requests).subscribe({
      next: () => {
        Swal.close();
        Swal.fire('Éxito', 'Equipos actualizados correctamente', 'success');
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error al actualizar equipos:', error);
        Swal.close();
        Swal.fire('Error', 'No se pudo actualizar equipos.', 'error');
      },
    });
  }

  saveRemplazos(): void {
    const replacements = this.remplazos
      .filter((rem) => rem.replacement_item_id && rem.provider_id)
      .map((rem) => ({
        ...(rem.id_replacement ? { id_replacement: rem.id_replacement } : {}),
        replacement_item_id: rem.replacement_item_id,
        provider_id: rem.provider_id,
        observations: rem.observations ?? '',
      }));
    if (!replacements.length) {
      Swal.fire('Info', 'No hay remplazos para actualizar.', 'info');
      return;
    }

    const headers = this.buildAuthHeaders();
    const payload = { replacements };

    Swal.fire({
      title: 'Actualizando remplazos...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    this.http
      .post(apiEndpoint(`v2/items/${this.itemId}/replacements`), payload, {
        headers,
      })
      .subscribe({
        next: () => {
          Swal.close();
          Swal.fire('Éxito', 'Remplazos actualizados correctamente', 'success');
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error al actualizar remplazos:', error);
          Swal.close();
          Swal.fire('Error', 'No se pudo actualizar remplazos.', 'error');
        },
      });
  }

  saveEquivalencias(): void {
    const payloads = this.equivalencias
      .filter((eq) => eq.replacement_item_id)
      .map((eq) => ({
        replacement_item_id: eq.replacement_item_id,
        observations: eq.observations ?? '',
      }));
    if (!payloads.length) {
      Swal.fire('Info', 'No hay equivalencias para actualizar.', 'info');
      return;
    }

    const headers = this.buildAuthHeaders();
    const requests = payloads.map((payload) =>
      this.http.post(
        apiEndpoint(`v2/items/${this.itemId}/equivalents`),
        payload,
        { headers }
      )
    );

    Swal.fire({
      title: 'Actualizando equivalencias...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    forkJoin(requests).subscribe({
      next: () => {
        Swal.close();
        Swal.fire(
          'Éxito',
          'Equivalencias actualizadas correctamente',
          'success'
        );
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error al actualizar equivalencias:', error);
        Swal.close();
        Swal.fire('Error', 'No se pudo actualizar equivalencias.', 'error');
      },
    });
  }

  saveConfiguration(): void {
    const payload = {
      requires_lot: this.product.configuration?.requires_lot ?? false,
      requires_expiration_date:
        this.product.configuration?.requires_expiration_date ?? false,
      requires_manufacture_date:
        this.product.configuration?.requires_manufacture_date ?? false,
      requires_invoice: this.product.configuration?.requires_invoice ?? false,
      relates_to_other_products:
        this.product.configuration?.relates_to_other_products ?? false,
    };
    const headers = this.buildAuthHeaders();

    Swal.fire({
      title: 'Actualizando configuración...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    this.http
      .put(apiEndpoint(`v2/items/${this.itemId}/configuration`), payload, {
        headers,
      })
      .subscribe({
        next: () => {
          Swal.close();
          Swal.fire(
            'Éxito',
            'Configuración actualizada correctamente',
            'success'
          );
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error al actualizar configuración:', error);
          Swal.close();
          Swal.fire('Error', 'No se pudo actualizar configuración.', 'error');
        },
      });
  }

  private notifyPendingSave(section: string, payload: any): void {
    console.log(`Payload ${section}:`, payload);
    Swal.fire(
      'Pendiente',
      `El endpoint para ${section} aun no esta definido.`,
      'info'
    );
  }

  goBack(): void {
    this.router.navigate(['/products/list']);
  }

  confirmCancelEdit(): void {
    Swal.fire({
      title: '¿Cerrar edición?',
      text: 'Antes de cerrar verifica que guardaste todos tus cambios.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar',
      cancelButtonText: 'No',
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/products/show', this.itemId]);
      }
    });
  }
}
