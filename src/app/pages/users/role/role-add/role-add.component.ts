
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RoleService } from '../role.service';
import { permissionsByCategoryResponse, RoleDetail, permission, RoleCreateRequest } from '../role';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-role-add',
  templateUrl: './role-add.component.html',
  styleUrl: './role-add.component.css'
})
export class RoleAddComponent implements OnInit {
  role: RoleDetail = {
    id: 0,
    name: '',
    guard_name: '',
    permissions: [] as any[]
  };

  loading: boolean = false;
  permissionsByCategory: {[key: string]: permission[]} = {};
  permissionCategories: {name: string, permissions: permission[]}[] = [];

  constructor(
    private roleService: RoleService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPermissionCategories();
  }

  private loadPermissionCategories(): void {
    this.roleService.permissionsByCategory().subscribe({
      next: (response: permissionsByCategoryResponse) => {
        if (response.data) {
          this.permissionsByCategory = response.data;

          this.permissionCategories = Object.entries(response.data).map(([categoryName, permissions]) => ({
            name: categoryName,
            permissions: permissions
          }));
        }
      },
      error: (error) => {
        console.error('Error al cargar categorías de permisos:', error);
        Swal.close();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al cargar las categorías de permisos',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  onPermissionChange(event: any, permission: permission): void {
    if (event.target.checked) {
      if (!this.role.permissions) {
        this.role.permissions = [];
      }
      const permissionName = permission.name;
      if (permissionName && !this.role.permissions.find((p: any) => p === permissionName)) {
        this.role.permissions.push(permissionName);
      }
    } else {
      if (this.role.permissions) {
        const permissionName = permission.name;
        this.role.permissions = this.role.permissions.filter((p: any) => p !== permissionName);
      }
    }
  }

  isPermissionChecked(permission: permission): boolean {
    if (!this.role.permissions) return false;
    const permName = permission.name;
    return (permName && this.role.permissions.includes(permName)) || false;
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

    if (!this.role.permissions || this.role.permissions.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: 'Por favor seleccione al menos un permiso'
      });
      return;
    }

    this.loading = true;
    this.showLoading();

    const payload: RoleCreateRequest = {
      name: this.role.name.trim(),
      guard_name: this.role.guard_name.trim(),
      permissions: (this.role.permissions as string[]) || []
    };

    this.roleService.addRole(payload as any).subscribe({
      next: (response) => {
        this.loading = false;
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Rol creado correctamente',
          confirmButtonText: 'Aceptar'
        }).then(() => {
          this.router.navigate(['/roles/list']);
        });
      },
      error: (error: any) => {
        this.loading = false;
        console.error('Error al crear rol:', error);
        Swal.close();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al crear el rol. Por favor intente nuevamente.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
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
      title: 'Creando rol...',
      text: 'Por favor espera mientras se crea el nuevo rol.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(null)
    });
  }
}
