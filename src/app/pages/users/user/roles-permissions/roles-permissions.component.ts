import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RoleService } from '../../../users/role/role.service';
import { RoleDetail } from '../user';
import { permission, permissionsByCategoryResponse } from '../../../users/role/role';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-roles-permissions',
  templateUrl: './roles-permissions.component.html',
  styleUrls: ['./roles-permissions.component.css']
})
export class RolesPermissionsComponent implements OnInit, OnChanges {
  @Input() formGroup!: FormGroup;
  @Input() availableRoles: RoleDetail[] = [];
  @Input() initialPermissions: permission[] = [];
  @Input() userEffectivePermissions: string[] = []; // Nuevo input para permisos efectivos
  @Input() userDirectPermissions: string[] = []; // Nuevo input para permisos directos
  @Input() canViewRoles: boolean = true; // Indica si el usuario puede ver la sección de roles
  @Output() formSubmit = new EventEmitter<any>();

  permissionsByCategory: { [key: string]: permission[] } = {};
  permissionCategories: { name: string; permissions: permission[] }[] = [];
  loading: boolean = false;
  canViewPermissions: boolean = true; // Indica si el usuario puede ver los permisos
  role: RoleDetail = {
    id: 0,
    name: '',
    guard_name: '',
    permissions: [] as any[]
  };

  constructor(private roleService: RoleService) {}

  ngOnInit(): void {
    this.loadPermissionsByCategory();
  }

  ngOnChanges(changes: SimpleChanges): void {

    // Cuando cambien los permisos efectivos o directos, actualizar la visualización
    if (changes['userEffectivePermissions'] || changes['userDirectPermissions'] || changes['initialPermissions']) {
      // Los permisos efectivos se usan para mostrar checkmarks
      // Los permisos directos se almacenan en role.permissions para edición
      if (this.userDirectPermissions && this.userDirectPermissions.length > 0) {
        this.setDirectPermissions();
      } else if (this.initialPermissions && this.initialPermissions.length > 0) {
        this.setInitialPermissions();
      }
    }

  }

  loadPermissionsByCategory(): void {
    this.loading = true;
    this.roleService.permissionsByCategory().subscribe({
      next: (response: permissionsByCategoryResponse) => {
        if (response.data) {
          this.permissionsByCategory = response.data;
          this.permissionCategories = Object.entries(response.data).map(
            ([categoryName, permissions]) => ({
              name: categoryName,
              permissions: permissions
            })
          );
          this.canViewPermissions = true;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar categorías de permisos:', error);
        this.loading = false;

        // Si es error 403 (Forbidden), simplemente ocultar la sección de permisos
        if (error.status === 403) {
          this.canViewPermissions = false;
        } else {
          // Solo mostrar alerta para otros tipos de errores
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al cargar las categorías de permisos',
            confirmButtonText: 'Aceptar'
          });
        }
      }
    });
  }

  onPermissionChange(event: any, permission: permission): void {
    const permissionName = permission.name;

    // Verificar si el permiso viene de un rol (no se puede modificar)
    const isFromRole = this.isPermissionFromRole(permission);

    if (isFromRole) {
      // Revertir el cambio en el checkbox
      event.target.checked = true;
      return;
    }

    // Manejar solo permisos directos
    if (event.target.checked) {
      // Agregar permiso directo
      if (!this.role.permissions) {
        this.role.permissions = [];
      }
      if (permissionName && !this.role.permissions.includes(permissionName)) {
        this.role.permissions.push(permissionName);
      }
    } else {
      // Quitar permiso directo (solo si no viene de roles)
      if (this.role.permissions && permissionName) {
        this.role.permissions = this.role.permissions.filter(
          (p: any) => p !== permissionName
        );
      }
    }

  }

  isPermissionChecked(permission: permission): boolean {
    const permName = permission.name;

    // Verificar si el permiso está en los permisos efectivos del usuario
    if (this.userEffectivePermissions && permName) {
      const isInEffective = this.userEffectivePermissions.includes(permName);
      return isInEffective;
    }

    // Fallback a la lógica anterior si no hay permisos efectivos
    if (!this.role.permissions) {
      return false;
    }

    const isChecked = permName && this.role.permissions.includes(permName);
    return isChecked || false;
  }

  isPermissionFromRole(permission: permission): boolean {
    // Verificar si el permiso viene de un rol (está en efectivos pero no en directos)
    if (!permission.name) return false;
    const isInEffective = this.userEffectivePermissions && this.userEffectivePermissions.includes(permission.name);
    const isInDirect = this.userDirectPermissions && this.userDirectPermissions.includes(permission.name);
    return isInEffective && !isInDirect;
  }

  setInitialPermissions(): void {
    if (this.initialPermissions && this.initialPermissions.length > 0) {
      // Asegurar que el array existe
      if (!this.role.permissions) {
        this.role.permissions = [];
      }
      this.role.permissions = this.initialPermissions.map((p: any) => p.name || p);
    } else {
      console.log('No hay permisos iniciales para establecer');
    }
  }

  setDirectPermissions(): void {
    // Establecer los permisos directos del usuario
    if (this.userDirectPermissions && this.userDirectPermissions.length > 0) {
      // Asegurar que el array existe
      if (!this.role.permissions) {
        this.role.permissions = [];
      }
      this.role.permissions = [...this.userDirectPermissions];
    } else {
      console.log('No hay permisos directos para establecer');
    }
  }

  getSelectedPermissions(): any[] {
    return this.role.permissions || [];
  }

  validateForm(): boolean {
    if (!this.formGroup) {
      console.error('Form group no asignado');
      return false;
    }

    const rolesControl = this.formGroup.get('roles');
    if (!rolesControl || rolesControl.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación requerida',
        text: 'Debe seleccionar al menos un rol',
        showConfirmButton: true
      });
      return false;
    }

    const statusControl = this.formGroup.get('status');
    if (!statusControl || statusControl.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación requerida',
        text: 'Debe seleccionar un status',
        showConfirmButton: true
      });
      return false;
    }

    return true;
  }
}
