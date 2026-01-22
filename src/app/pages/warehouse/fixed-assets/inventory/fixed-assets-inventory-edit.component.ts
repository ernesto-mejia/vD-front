import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
  selector: 'app-fixed-assets-inventory-edit',
  templateUrl: './fixed-assets-inventory-edit.component.html',
  styleUrls: ['./fixed-assets-inventory-edit.component.css'],
})
export class FixedAssetsInventoryEditComponent implements OnInit {
  submitted = false;
  loading = false;
  itemId = 0;

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
    private route: ActivatedRoute,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.itemId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadMeta();
    this.loadItem();
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

  private loadItem(): void {
    this.loading = true;
    this.fixedAssetsService.getInventoryItem(this.itemId).subscribe({
      next: (item) => {
        this.loading = false;
        if (item) {
          this.item = { ...item };
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error al cargar inventario:', error);
      },
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

  updateInventory(): void {
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
    this.fixedAssetsService.updateInventory(this.itemId, this.item).subscribe({
      next: () => {
        this.loading = false;
        Swal.fire({
          icon: 'success',
          title: 'Activo actualizado',
          text: 'El activo fijo ha sido actualizado exitosamente.',
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          this.router.navigate(['/fixed-assets/inventory/list']);
        });
      },
      error: (error) => {
        this.loading = false;
        console.error('Error al actualizar inventario:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrio un error al actualizar el activo.',
        });
      },
    });
  }

  goBack(): void {
    this.location.back();
  }
}
