import { Component, Input, OnInit } from '@angular/core';
import { RoleService } from '../role.service';
import { RoleDetail, RoleResponse } from '../role';

@Component({
  selector: 'app-role-form',
  templateUrl: './role-form.component.html',
  styleUrl: './role-form.component.css',
})
export class RoleFormComponent implements OnInit {
  @Input() roleId: string | number | null = null;

  role: RoleDetail = {
    id: 0,
    name: '',
    permissions: [] as any[]
  };

  constructor(private roleService: RoleService) {}

  ngOnInit(): void {
    if (this.roleId) {
      this.loadRole();
    }
  }

  loadRole(): void {
    if (!this.roleId) return;

    const id = typeof this.roleId === 'string' ? parseInt(this.roleId, 10) : this.roleId;

    this.roleService.getRoleById(id).subscribe({
      next: (response: RoleResponse) => {
        this.role = response.data || {};
      },
      error: (err: any) => {
        console.error('Error cargando rol:', err);
      }
    });
  }

  onSubmit(): void {
    if (!this.role.name) {
      alert('Por favor complete el nombre del rol');
      return;
    }

    const payload: RoleDetail = {
      id: this.role.id,
      name: this.role.name,
      permissions: this.role.permissions || []
    };

    if (this.roleId) {
      const id = typeof this.roleId === 'string' ? parseInt(this.roleId, 10) : this.roleId;
      // this.roleService.updateRole(id, payload).subscribe({
      //   next: () => {
      //     alert('Rol actualizado correctamente');
      //   },
      //   error: (err: any) => {
      //     console.error('Error actualizando rol:', err);
      //     alert('Error al actualizar el rol');
      //   }
      // });
    } else {
      // this.roleService.addRole(payload).subscribe({
      //   next: () => {
      //     alert('Rol creado correctamente');
      //   },
      //   error: (err: any) => {
      //     console.error('Error creando rol:', err);
      //     alert('Error al crear el rol');
      //   }
      // });
    }
  }

  onCancel(): void {
    window.history.back();
  }
}
