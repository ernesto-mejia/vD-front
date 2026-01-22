import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { PruebaService } from '../prueba.service';
import {
  Prueba,
  ClientOption,
  SpecialtyOption,
} from '../pruebas';
import { PruebaPermissionService } from '../services/prueba-permission.service';

@Component({
  selector: 'app-prueba-show',
  templateUrl: './prueba-show.component.html',
  styleUrls: ['./prueba-show.component.css'],
})
export class PruebaShowComponent implements OnInit, OnDestroy {
  loading = true;
  pruebaId: number = 0;
  prueba: Prueba | null = null;

  // Permisos
  canEditPruebas: boolean = false;
  canDeletePruebas: boolean = false;

  // Catálogos para mostrar nombres
  clientsCatalog: ClientOption[] = [];
  specialties: SpecialtyOption[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private pruebaService: PruebaService,
    private pruebaPermissionService: PruebaPermissionService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.checkUserPermissions();
    this.pruebaId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadCatalogs();
    this.loadPrueba();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkUserPermissions(): void {
    this.canEditPruebas = this.pruebaPermissionService.canEditPruebas();
    this.canDeletePruebas = this.pruebaPermissionService.canDeletePruebas();
  }

  private loadCatalogs(): void {
    this.pruebaService
      .getClientsCatalog()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (clients) => {
          this.clientsCatalog = clients || [];
        },
        error: (error) => console.error('Error al cargar clientes:', error),
      });

    this.pruebaService
      .getSpecialties()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (specialties) => {
          this.specialties = specialties || [];
        },
        error: (error) =>
          console.error('Error al cargar especialidades:', error),
      });
  }

  private loadPrueba(): void {
    Swal.fire({
      title: 'Cargando...',
      text: 'Por favor espera mientras se cargan los datos.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(null),
    });

    this.pruebaService
      .getPrueba(this.pruebaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          Swal.close();

          if (response) {
            this.prueba = response;

          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se encontró el estudio.',
            });
          }
        },
        error: (error) => {
          this.loading = false;
          Swal.close();
          console.error('Error al cargar estudio:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar la información del estudio.',
          });
        },
      });
  }

  getClientName(clientId?: number): string {
    if (!clientId) return '-';
    const client = this.clientsCatalog.find((c) => c.id === clientId);
    return client?.name ?? `Cliente #${clientId}`;
  }

  getSpecialtyName(specialtyId?: number): string {
    if (!specialtyId) return '-';
    const specialty = this.specialties.find((s) => s.id === specialtyId);
    return specialty?.name ?? `Especialidad #${specialtyId}`;
  }

  goBack(): void {
    this.location.back();
  }

  goToEdit(): void {
    this.router.navigate(['/pruebas/edit', this.pruebaId]);
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
        this.deletePrueba();
      }
    });
  }

  private deletePrueba(): void {
    Swal.fire({
      title: 'Eliminando...',
      text: 'Por favor espera.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(null),
    });

    this.pruebaService
      .deletePrueba(this.pruebaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
          title: 'Eliminado',
          text: 'El estudio ha sido eliminado correctamente.',
            timer: 2000,
            showConfirmButton: false,
          }).then(() => {
            this.router.navigate(['/pruebas/list']);
          });
        },
        error: (error) => {
          console.error('Error al eliminar estudio:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
          text: 'No se pudo eliminar el estudio.',
          });
        },
      });
  }
}
