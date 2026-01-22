import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { PurchasePriceListService } from '../purchase-price-list.service';
import { PurchasePriceList, ProviderOption } from '../purchase-price-list';
import { PurchasePriceListPermissionService } from '../services/purchase-price-list-permission.service';

@Component({
  selector: 'app-purchase-price-list-show',
  templateUrl: './purchase-price-list-show.component.html',
  styleUrls: ['./purchase-price-list-show.component.css'],
})
export class PurchasePriceListShowComponent implements OnInit, OnDestroy {
  loading = true;
  priceListId: number = 0;
  priceList: PurchasePriceList | null = null;

  // Permisos
  canEditPriceLists: boolean = false;
  canDeletePriceLists: boolean = false;
  providersCatalog: ProviderOption[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private priceListService: PurchasePriceListService,
    private permissionService: PurchasePriceListPermissionService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.checkUserPermissions();
    this.priceListId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadPriceList();
    this.loadProvidersCatalog();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkUserPermissions(): void {
    this.canEditPriceLists = this.permissionService.canEditPriceLists();
    this.canDeletePriceLists = this.permissionService.canDeletePriceLists();
  }

  private loadPriceList(): void {
    Swal.fire({
      title: 'Cargando...',
      text: 'Por favor espera mientras se cargan los datos.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(null),
    });

    this.priceListService
      .getPriceList(this.priceListId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          Swal.close();

          if (response) {
            this.priceList = response;
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se encontró la lista de precios.',
            });
          }
        },
        error: (error) => {
          this.loading = false;
          Swal.close();
          console.error('Error al cargar lista de precios:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar la información de la lista de precios.',
          });
        },
      });
  }

  private loadProvidersCatalog(): void {
    this.priceListService
      .getProvidersCatalog()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (providers) => {
          this.providersCatalog = providers || [];
        },
        error: (error) => {
          console.error('Error al cargar proveedores:', error);
        },
      });
  }

  getProviderName(): string {
    if (!this.priceList?.provider_id) {
      return '-';
    }
    if (this.priceList.provider_name) {
      return this.priceList.provider_name;
    }
    const provider = this.providersCatalog.find(
      (p) => p.id === this.priceList?.provider_id
    );
    return provider?.name || `#${this.priceList.provider_id}`;
  }

  formatDate(date?: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatCurrency(amount: number, currency?: string): string {
    const currencyCode = currency || this.priceList?.currency || 'MXN';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  }

  goBack(): void {
    this.location.back();
  }

  goToEdit(): void {
    this.router.navigate(['/purchases/purchase-price-list/edit', this.priceListId]);
  }

  confirmDelete(): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.deletePriceList();
      }
    });
  }

  private deletePriceList(): void {
    Swal.fire({
      title: 'Eliminando...',
      text: 'Por favor espera.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(null),
    });

    this.priceListService
      .deletePriceList(this.priceListId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: 'La lista de precios ha sido eliminada correctamente.',
            timer: 2000,
            showConfirmButton: false,
          }).then(() => {
            this.router.navigate(['/purchases/purchase-price-list/list']);
          });
        },
        error: (error) => {
          console.error('Error al eliminar lista de precios:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo eliminar la lista de precios.',
          });
        },
      });
  }
}
