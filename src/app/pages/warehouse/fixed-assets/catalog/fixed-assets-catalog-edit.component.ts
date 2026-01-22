import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import Swal from 'sweetalert2';
import {
  FixedAssetCatalogItem,
  FixedAssetProviderOption,
  FixedAssetsService,
} from '../fixed-assets.service';

@Component({
  selector: 'app-fixed-assets-catalog-edit',
  templateUrl: './fixed-assets-catalog-edit.component.html',
  styleUrls: ['./fixed-assets-catalog-edit.component.css'],
})
export class FixedAssetsCatalogEditComponent implements OnInit {
  submitted = false;
  loading = false;
  itemId = 0;

  item: FixedAssetCatalogItem = {
    id: 0,
    name: '',
    category: '',
    provider_id: undefined,
    is_billable: false,
    is_purchasable: false,
  };

  categories: string[] = [];
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
    this.fixedAssetsService.getProvidersCatalog().subscribe({
      next: (providers) => (this.providers = providers || []),
    });
  }

  private loadItem(): void {
    this.loading = true;
    this.fixedAssetsService.getCatalogItem(this.itemId).subscribe({
      next: (item) => {
        this.loading = false;
        if (item) {
          this.item = { ...item };
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error al cargar catalogo:', error);
      },
    });
  }

  updateCatalog(): void {
    this.submitted = true;

    if (!this.item.name || !this.item.category) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'Por favor complete los campos obligatorios.',
      });
      return;
    }

    this.loading = true;
    this.fixedAssetsService.updateCatalog(this.itemId, this.item).subscribe({
      next: () => {
        this.loading = false;
        Swal.fire({
          icon: 'success',
          title: 'Catalogo actualizado',
          text: 'El activo fijo ha sido actualizado exitosamente.',
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          this.router.navigate(['/fixed-assets/catalog/list']);
        });
      },
      error: (error) => {
        this.loading = false;
        console.error('Error al actualizar catalogo:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrio un error al actualizar el catalogo.',
        });
      },
    });
  }

  goBack(): void {
    this.location.back();
  }
}
