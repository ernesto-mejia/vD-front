import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import Swal from 'sweetalert2';
import {
  FixedAssetCatalogItem,
  FixedAssetProviderOption,
  FixedAssetsService,
} from '../fixed-assets.service';

@Component({
  selector: 'app-fixed-assets-catalog-add',
  templateUrl: './fixed-assets-catalog-add.component.html',
  styleUrls: ['./fixed-assets-catalog-add.component.css'],
})
export class FixedAssetsCatalogAddComponent implements OnInit {
  submitted = false;
  loading = false;

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
    private location: Location
  ) {}

  ngOnInit(): void {
    this.loadMeta();
  }

  private loadMeta(): void {
    this.fixedAssetsService.getCategories().subscribe({
      next: (categories) => (this.categories = categories || []),
    });
    this.fixedAssetsService.getProvidersCatalog().subscribe({
      next: (providers) => (this.providers = providers || []),
    });
  }

  saveCatalog(): void {
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
    this.fixedAssetsService.createCatalog(this.item).subscribe({
      next: (response) => {
        this.loading = false;
        Swal.fire({
          icon: 'success',
          title: 'Catalogo creado',
          text: 'El activo fijo ha sido creado exitosamente.',
          showCancelButton: true,
          confirmButtonText: 'Ver detalle',
          cancelButtonText: 'Regresar a lista',
          reverseButtons: true,
        }).then((result) => {
          if (result.isConfirmed && response?.id) {
            this.router.navigate(['/fixed-assets/catalog/show', response.id]);
            return;
          }
          this.router.navigate(['/fixed-assets/catalog/list']);
        });
      },
      error: (error) => {
        this.loading = false;
        console.error('Error al crear catalogo:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrio un error al crear el catalogo.',
        });
      },
    });
  }

  goBack(): void {
    this.location.back();
  }
}
