import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import Swal from 'sweetalert2';
import { FixedAssetInventoryItem, FixedAssetsService } from '../fixed-assets.service';

@Component({
  selector: 'app-fixed-assets-inventory-show',
  templateUrl: './fixed-assets-inventory-show.component.html',
  styleUrls: ['./fixed-assets-inventory-show.component.css'],
})
export class FixedAssetsInventoryShowComponent implements OnInit {
  loading = true;
  itemId = 0;
  item: FixedAssetInventoryItem | null = null;

  constructor(
    private fixedAssetsService: FixedAssetsService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.itemId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadItem();
  }

  private loadItem(): void {
    this.fixedAssetsService.getInventoryItem(this.itemId).subscribe({
      next: (item) => {
        this.item = item;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        console.error('Error al cargar inventario:', error);
      },
    });
  }

  getCatalogName(catalogId?: number): string {
    return this.fixedAssetsService.getCatalogName(catalogId);
  }

  getProviderName(providerId?: number): string {
    return this.fixedAssetsService.getProviderName(providerId);
  }

  goBack(): void {
    this.location.back();
  }

  goToEdit(): void {
    this.router.navigate(['/fixed-assets/inventory/edit', this.itemId]);
  }

  confirmDelete(): void {
    Swal.fire({
      title: '¿Estas seguro?',
      text: 'Esta accion no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteItem();
      }
    });
  }

  private deleteItem(): void {
    this.fixedAssetsService.deleteInventory(this.itemId).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'El activo ha sido eliminado correctamente.',
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          this.router.navigate(['/fixed-assets/inventory/list']);
        });
      },
      error: (error) => {
        console.error('Error al eliminar inventario:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar el activo.',
        });
      },
    });
  }
}
