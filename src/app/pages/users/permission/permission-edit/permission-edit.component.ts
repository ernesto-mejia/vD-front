import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PermissionService } from '../permission.service';
import { PermissionDetail, PermissionResponse } from '../permission';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-permission-edit',
  templateUrl: './permission-edit.component.html',
  styleUrl: './permission-edit.component.css',
})
export class PermissionEditComponent implements OnInit, OnDestroy {
  @Input() permissionId: string | number | null = null;

  permission: PermissionDetail = {
    id: 0,
    name: '',
    guard_name: ''
  };

  loading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private permissionService: PermissionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.permissionId = params['id'] || null;
      if (this.permissionId) {
        this.loadPermission();
      }
    });
  }

  private loadPermission(): void {
    this.loading = true;
    this.showLoading();

    if (!this.permissionId) {
      this.loading = false;
      Swal.close();
      return;
    }

    const id = typeof this.permissionId === 'string' ? parseInt(this.permissionId, 10) : this.permissionId;

    this.permissionService.getPermissionById(id).subscribe({
      next: (response: PermissionResponse) => {
        this.permission = response.data || {};
        this.loading = false;
        Swal.close();
      },
      error: (err: any) => {
        this.loading = false;
        Swal.close();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al cargar el permiso',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  onSubmit(): void {
    if (!this.permission.name || this.permission.name.trim() === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'Por favor complete el nombre del permiso'
      });
      return;
    }

    this.loading = true;
    this.showLoading();

    const payload: PermissionDetail = {
      name: this.permission.name.trim(),
      guard_name: this.permission.guard_name || ''
    };

    if (this.permissionId) {
      const id = typeof this.permissionId === 'string' ? parseInt(this.permissionId, 10) : this.permissionId;
      this.permissionService.updatePermission(id, payload).subscribe({
        next: () => {
          this.loading = false;
          Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: 'Permiso actualizado correctamente',
            confirmButtonText: 'Aceptar'
          }).then(() => {
            this.router.navigate(['/permissions/list']);
          });
        },
        error: (err: any) => {
          this.loading = false;
          console.error('Error actualizando permiso:', err);
          Swal.close();
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al actualizar el permiso. Por favor intente nuevamente.',
            confirmButtonText: 'Aceptar'
          });
        }
      });
    }
  }

  onCancel(): void {
    if (this.permission.name && this.permission.name.trim() !== '') {
      Swal.fire({
        title: '¿Descartar cambios?',
        text: 'Los cambios no guardados se perderán',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, descartar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/permissions/list']);
        }
      });
    } else {
      this.router.navigate(['/permissions/list']);
    }
  }

  private showLoading(): void {
    Swal.fire({
      title: 'Cargando...',
      text: 'Por favor espera mientras se cargan los datos.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(null)
    });
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }
}
