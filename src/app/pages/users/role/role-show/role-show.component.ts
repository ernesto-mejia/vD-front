import { RoleResponse } from './../role';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RoleService } from '../role.service';
import Swal from 'sweetalert2';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';

interface PermissionCategory {
  id: number;
  name: string;
  permissions: any[];
}

@Component({
  selector: 'app-role-show',
  standalone: false,
  templateUrl: './role-show.component.html',
  styleUrl: './role-show.component.css'
})
export class RoleShowComponent implements OnInit, OnDestroy {
  role: any;
  roleId: string = '';
  loading: boolean = false;
  permissionCategories: PermissionCategory[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private roleService: RoleService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.roleId = this.route.snapshot.paramMap.get('id') || '';
    if (this.roleId) {
      this.loadRoleData();
    }
  }

  private loadRoleData(): void {
    this.loading = true;
    this.showLoading();

    this.roleService.getRoleById(Number(this.roleId))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: RoleResponse) => this.handleSuccessResponse(response),
        error: (error: HttpErrorResponse) => this.handleErrorResponse(error)
      });
  }

  private handleSuccessResponse(response: RoleResponse): void {
    if (!response || !response.data) {
      this.loading = false;
      Swal.close();
      this.handleError('Datos del rol no válidos');
      return;
    }
    this.role = response.data;
    this.loadPermissionCategories();
    this.loading = false;
    Swal.close();
  }

  private loadPermissionCategories(): void {
    this.roleService.permissionsByCategory()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.data) {
            this.permissionCategories = Object.entries(response.data).map(([categoryName, permissions]: [string, any]) => ({
              id: 0,
              name: categoryName,
              permissions: Array.isArray(permissions)
                ? permissions.filter((p: any) =>
                    this.role.permissions?.some((rp: any) => rp.id === p.id)
                  )
                : []
            }));
          }
        },
        error: (error: any) => {
          console.error('Error al cargar categorías de permisos:', error);
          this.permissionCategories = [];
        }
      });
  }  private handleErrorResponse(error: HttpErrorResponse): void {
    this.loading = false;
    Swal.close();
    console.error('Error al cargar el rol:', error);
    let errorMessage = 'No se pudo cargar la información del rol';
    if (error.status === 401) {
      errorMessage = 'Sesión expirada. Por favor, inicie sesión nuevamente';
      this.router.navigate(['/login']);
    } else if (error.status === 404) {
      errorMessage = 'Rol no encontrado';
    } else if (error.status === 0) {
      errorMessage = 'Error de conexión. Verifique su conexión a internet';
    }
    this.handleError(errorMessage);
  }

  onEdit(): void {
    this.router.navigate(['/roles/edit', this.roleId]);
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

    this.roleService.deleteRole(Number(this.roleId))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: 'El rol ha sido eliminado correctamente',
            confirmButtonText: 'Aceptar'
          }).then(() => {
            this.router.navigate(['/roles/list']);
          });
        },
        error: (error) => {
          this.loading = false;
          console.error('Error al eliminar rol:', error);
          Swal.close();
          this.handleError('Error al eliminar el rol. Por favor intente nuevamente.');
        }
      });
  }

  onCancel(): void {
    this.router.navigate(['/roles/list']);
  }

  private showLoading(): void {
    Swal.fire({
      title: 'Cargando...',
      text: 'Obteniendo información del rol',
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

  hasAssignedPermissions(): boolean {
    return this.permissionCategories?.some(c => c.permissions.length > 0) || false;
  }
}
