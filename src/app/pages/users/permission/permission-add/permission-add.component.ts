import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PermissionService } from '../permission.service';
import { PermissionDetail } from '../permission';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-permission-add',
  templateUrl: './permission-add.component.html',
  styleUrl: './permission-add.component.css'
})
export class PermissionAddComponent implements OnInit {
  permission: PermissionDetail = {
    id: 0,
    name: '',
    guard_name: ''
  };

  loading: boolean = false;

  constructor(
    private permissionService: PermissionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Inicializar el componente si es necesario
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

    this.permissionService.addPermission(payload).subscribe({
      next: (response) => {
        this.loading = false;
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Permiso creado correctamente',
          confirmButtonText: 'Aceptar'
        }).then(() => {
          this.router.navigate(['/permissions/list']);
        });
      },
      error: (error: any) => {
        this.loading = false;
        console.error('Error al crear permiso:', error);
        Swal.close();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al crear el permiso. Por favor intente nuevamente.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
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
      title: 'Creando permiso...',
      text: 'Por favor espera mientras se crea el nuevo permiso.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(null)
    });
  }
}
