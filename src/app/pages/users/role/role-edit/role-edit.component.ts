import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RoleService } from '../role.service';
import { RoleDetail, RoleResponse, permissionsByCategoryResponse, permission, RoleCreateRequest } from '../role';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-role-edit',
  templateUrl: './role-edit.component.html',
  styleUrl: './role-edit.component.css',
})
export class RoleEditComponent implements OnInit, OnDestroy {
  @Input() roleId: string | number | null = null;

  role: RoleDetail = {
    id: 0,
    name: '',
    guard_name: '',
    permissions: [] as any[]
  };

  loading: boolean = false;
  permissionsByCategory: {[key: string]: permission[]} = {};
  permissionCategories: {name: string, permissions: permission[]}[] = [];
  selectedPermissionNames: Set<string> = new Set();

  constructor(
    private route: ActivatedRoute,
    private roleService: RoleService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.roleId = params['id'] || null;
      if (this.roleId) {
        this.loadData();
      }
    });
  }

  private loadData(): void {
    this.loading = true;
    this.showLoading();
    Promise.all([
      this.loadPermissionCategories(),
      this.loadRole()
    ]).then(() => {
      this.loading = false;
      Swal.close();
    }).catch((error) => {
      console.error('Error al cargar datos:', error);
      this.loading = false;
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar los datos del rol'
      });
    });
  }

  private loadPermissionCategories(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.roleService.permissionsByCategory().subscribe({
        next: (response: permissionsByCategoryResponse) => {
          if (response.data) {
            this.permissionsByCategory = response.data;
            this.permissionCategories = Object.entries(response.data).map(([categoryName, permissions]) => ({
              name: categoryName,
              permissions: permissions
            }));
          }
          resolve();
        },
        error: (error) => reject(error)
      });
    });
  }

  private loadRole(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.roleId) {
        reject('No roleId provided');
        return;
      }
      const id = typeof this.roleId === 'string' ? parseInt(this.roleId, 10) : this.roleId;
      this.roleService.getRoleById(id).subscribe({
        next: (response: RoleResponse) => {
          this.role = response.data || {};
          if (this.role.permissions && Array.isArray(this.role.permissions)) {
            this.role.permissions.forEach((perm: any) => {
              const permName = typeof perm === 'string' ? perm : perm.name;
              if (permName) {
                this.selectedPermissionNames.add(permName);
              }
            });
          }
          resolve();
        },
        error: (err: any) => {
          console.error('Error cargando rol:', err);
          reject(err);
        }
      });
    });
  }

  isPermissionChecked(permission: permission): boolean {
    if (!permission.name) return false;
    return this.selectedPermissionNames.has(permission.name);
  }

  onPermissionChange(event: any, permission: permission): void {
    if (!permission.name) return;

    if (event.target.checked) {
      this.selectedPermissionNames.add(permission.name);
    } else {
      this.selectedPermissionNames.delete(permission.name);
    }
    this.role.permissions = Array.from(this.selectedPermissionNames);
  }

  onSubmit(): void {
    if (!this.role.name || this.role.name.trim() === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'Por favor complete el nombre del rol'
      });
      return;
    }

    if (!this.role.guard_name || this.role.guard_name.trim() === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'Por favor complete el guard name'
      });
      return;
    }

    this.loading = true;
    this.showLoading();

    const payload: RoleCreateRequest = {
      name: this.role.name.trim(),
      guard_name: this.role.guard_name.trim(),
      permissions: Array.from(this.selectedPermissionNames)
    };

    if (this.roleId) {
      const id = typeof this.roleId === 'string' ? parseInt(this.roleId, 10) : this.roleId;
      this.roleService.updateRole(id, payload as any).subscribe({
        next: () => {
          this.loading = false;
          Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: 'Rol actualizado correctamente',
            confirmButtonText: 'Aceptar'
          }).then(() => {
            // this.router.navigate(['/roles/list']);
          });
        },
        error: (err: any) => {
          this.loading = false;
          console.error('Error actualizando rol:', err);
          Swal.close();
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al actualizar el rol. Por favor intente nuevamente.',
            confirmButtonText: 'Aceptar'
          });
        }
      });
    }
  }

  onCancel(): void {
    if (this.role.name && this.role.name.trim() !== '') {
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
          this.router.navigate(['/roles/list']);
        }
      });
    } else {
      this.router.navigate(['/roles/list']);
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

  hasAssignedPermissions(): boolean {
    return (this.role?.permissions?.length ?? 0) > 0;
  }
}
