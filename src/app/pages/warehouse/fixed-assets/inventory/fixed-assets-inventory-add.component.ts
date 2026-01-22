import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import Swal from 'sweetalert2';
import {
  FixedAssetCatalogItem,
  FixedAssetInventoryItem,
  FixedAssetOwnershipType,
  FixedAssetProviderOption,
  FixedAssetsService,
} from '../fixed-assets.service';

@Component({
  selector: 'app-fixed-assets-inventory-add',
  templateUrl: './fixed-assets-inventory-add.component.html',
  styleUrls: ['./fixed-assets-inventory-add.component.css'],
})
export class FixedAssetsInventoryAddComponent implements OnInit {
  submitted = false;
  loading = false;

  item: FixedAssetInventoryItem = {
    id: 0,
    internal_code: '',
    name: '',
    location: '',
    category: '',
    serial_number: '',
    catalog_id: undefined,
    ownership_type: 'comodato',
    comodato_valid_from: '',
    comodato_valid_until: '',
    comodato_owner: '',
    comodato_provider_id: undefined,
    comodato_observations: '',
    plate_id: '',
    acquisition_date: '',
    acquisition_value: undefined,
    owned_observations: '',
    maintenance_required: false,
    maintenance_type: '',
    maintenance_date_from: '',
    maintenance_date_until: '',
    maintenance_description: '',
    maintenance_observations: '',
    accessories: [],
  };

  categories: string[] = [];
  catalogItems: FixedAssetCatalogItem[] = [];
  providers: FixedAssetProviderOption[] = [];

  constructor(
    private fixedAssetsService: FixedAssetsService,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.loadMeta();
  }

  private loadMeta(): void {
    this.fixedAssetsService.getCategories().subscribe({
      next: (categories) => (this.categories = categories || []),
    });
    this.fixedAssetsService.getCatalog().subscribe({
      next: (items) => (this.catalogItems = items || []),
    });
    this.fixedAssetsService.getProvidersCatalog().subscribe({
      next: (providers) => (this.providers = providers || []),
    });
  }

  onOwnershipChange(type: FixedAssetOwnershipType): void {
    this.item.ownership_type = type;
    if (type === 'comodato') {
      this.item.plate_id = '';
      this.item.acquisition_date = '';
      this.item.acquisition_value = undefined;
      this.item.owned_observations = '';
      return;
    }
    this.item.comodato_valid_from = '';
    this.item.comodato_valid_until = '';
    this.item.comodato_owner = '';
    this.item.comodato_provider_id = undefined;
    this.item.comodato_observations = '';
  }

  onMaintenanceRequiredChange(): void {
    if (!this.item.maintenance_required) {
      this.item.maintenance_type = '';
      this.item.maintenance_date_from = '';
      this.item.maintenance_date_until = '';
      this.item.maintenance_description = '';
      this.item.maintenance_observations = '';
    }
  }

  addAccessory(): void {
    this.item.accessories = this.item.accessories || [];
    this.item.accessories.push({ description: '', quantity: null });
  }

  removeAccessory(index: number): void {
    if (!this.item.accessories) {
      return;
    }
    this.item.accessories.splice(index, 1);
  }

  saveInventory(): void {
    this.submitted = true;

    if (!this.item.internal_code || !this.item.name || !this.item.location || !this.item.category) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'Por favor complete los campos obligatorios.',
      });
      return;
    }

    this.loading = true;
    this.fixedAssetsService.createInventory(this.item).subscribe({
      next: (response) => {
        this.loading = false;
        Swal.fire({
          icon: 'success',
          title: 'Activo creado',
          text: 'El activo fijo ha sido creado exitosamente.',
          showCancelButton: true,
          confirmButtonText: 'Ver detalle',
          cancelButtonText: 'Regresar a lista',
          reverseButtons: true,
        }).then((result) => {
          if (result.isConfirmed && response?.id) {
            this.router.navigate(['/fixed-assets/inventory/show', response.id]);
            return;
          }
          this.router.navigate(['/fixed-assets/inventory/list']);
        });
      },
      error: (error) => {
        this.loading = false;
        console.error('Error al crear inventario:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrio un error al crear el activo.',
        });
      },
    });
  }

  goBack(): void {
    this.location.back();
  }
}
