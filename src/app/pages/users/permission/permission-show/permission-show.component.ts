import { PermissionResponse } from './../permission';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PermissionService } from '../permission.service';
import Swal from 'sweetalert2';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-permission-show',
  standalone: false,
  templateUrl: './permission-show.component.html',
  styleUrl: './permission-show.component.css'
})
export class PermissionShowComponent implements OnInit, OnDestroy {
  permission: any;
  permissionId: string = '';
  loading: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private permissionService: PermissionService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.permissionId = this.route.snapshot.paramMap.get('id') || '';
    if (this.permissionId) {
      this.loadPermissionData();
    }
  }

  private loadPermissionData(): void {
    this.loading = true;
    this.showLoading();

    this.permissionService.getPermissionById(Number(this.permissionId))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: PermissionResponse) => this.handleSuccessResponse(response),
        error: (error: HttpErrorResponse) => this.handleErrorResponse(error)
      });
  }

  private handleSuccessResponse(response: PermissionResponse): void {
    if (!response || !response.data) {
      this.loading = false;
      Swal.close();
      this.handleError('Datos del permiso no válidos');
      return;
    }
    this.permission = response.data;
    this.loading = false;
    Swal.close();
  }

  private handleErrorResponse(error: HttpErrorResponse): void {
    this.loading = false;
    Swal.close();
    console.error('Error al cargar el permiso:', error);
    let errorMessage = 'No se pudo cargar la información del permiso';
    if (error.status === 401) {
      errorMessage = 'Sesión expirada. Por favor, inicie sesión nuevamente';
      this.router.navigate(['/login']);
    } else if (error.status === 404) {
      errorMessage = 'Permiso no encontrado';
    } else if (error.status === 0) {
      errorMessage = 'Error de conexión. Verifique su conexión a internet';
    }
    this.handleError(errorMessage);
  }

  onEdit(): void {
    this.router.navigate(['/permissions/edit', this.permissionId]);
  }

  onDelete(): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.executeDelete();
      }
    });
  }

  private executeDelete(): void {
    this.loading = true;
    this.showLoading();

    this.permissionService.deletePermission(Number(this.permissionId))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: 'El permiso ha sido eliminado correctamente',
            confirmButtonText: 'Aceptar'
          }).then(() => {
            this.router.navigate(['/permissions/list']);
          });
        },
        error: (error) => {
          this.loading = false;
          console.error('Error al eliminar permiso:', error);
          Swal.close();
          this.handleError('Error al eliminar el permiso. Por favor intente nuevamente.');
        }
      });
  }

  onCancel(): void {
    this.router.navigate(['/permissions/list']);
  }

  private showLoading(): void {
    Swal.fire({
      title: 'Cargando...',
      text: 'Obteniendo información del permiso',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading(null);
      }
    });
  }

  private handleError(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#0d6efd'
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
