import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { ServiceService } from '../service.service';
import { ProviderOption, Service } from '../services';
import { ServicePermissionService } from '../services/service-permission.service';

@Component({
  selector: 'app-service-show',
  templateUrl: './service-show.component.html',
  styleUrls: ['./service-show.component.css'],
})
export class ServiceShowComponent implements OnInit, OnDestroy {
  loading = true;
  serviceId: number = 0;
  service: Service | null = null;

  // Permisos
  canEditServices: boolean = false;
  canDeleteServices: boolean = false;
  providersCatalog: ProviderOption[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private serviceService: ServiceService,
    private servicePermissionService: ServicePermissionService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.checkUserPermissions();
    this.serviceId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadService();
    this.loadProvidersCatalog();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkUserPermissions(): void {
    this.canEditServices = this.servicePermissionService.canEditServices();
    this.canDeleteServices = this.servicePermissionService.canDeleteServices();
  }

  private loadService(): void {
    Swal.fire({
      title: 'Cargando...',
      text: 'Por favor espera mientras se cargan los datos.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(null),
    });

    this.serviceService
      .getService(this.serviceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          Swal.close();

          if (response) {
            this.service = response;
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se encontró el servicio.',
            });
          }
        },
        error: (error) => {
          this.loading = false;
          Swal.close();
          console.error('Error al cargar servicio:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar la información del servicio.',
          });
        },
      });
  }

  private loadProvidersCatalog(): void {
    this.serviceService
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

  getSatUnitDisplay(code?: string): string {
    return code || '-';
  }

  getProviderLabels(): string[] {
    const providerIds = this.service?.providers || [];
    if (!providerIds.length) {
      return [];
    }
    return providerIds.map((id) => {
      const match = this.providersCatalog.find((provider) => provider.id === id);
      if (!match) {
        return `#${id}`;
      }
      return match.name || `#${id}`;
    });
  }

  goBack(): void {
    this.location.back();
  }

  goToEdit(): void {
    this.router.navigate(['/services/edit', this.serviceId]);
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
        this.deleteService();
      }
    });
  }

  private deleteService(): void {
    Swal.fire({
      title: 'Eliminando...',
      text: 'Por favor espera.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(null),
    });

    this.serviceService
      .deleteService(this.serviceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: 'El servicio ha sido eliminado correctamente.',
            timer: 2000,
            showConfirmButton: false,
          }).then(() => {
            this.router.navigate(['/services/list']);
          });
        },
        error: (error) => {
          console.error('Error al eliminar servicio:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo eliminar el servicio.',
          });
        },
      });
  }
}
