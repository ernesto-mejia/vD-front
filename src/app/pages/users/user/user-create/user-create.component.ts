import { Component, OnInit, ViewChild } from '@angular/core';
import Swal from 'sweetalert2';
import { AuthService } from '../../../../auth.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { UserService } from '../user.service';
import { RoleDetail } from '../user';
import { RolesPermissionsComponent } from '../roles-permissions/roles-permissions.component';


@Component({
  selector: 'app-user-create',
  templateUrl: './user-create.component.html',
  styleUrls: ['./user-create.component.css']
})
export class UserCreateComponent implements OnInit {
  @ViewChild(RolesPermissionsComponent) rolesPermissionsComponent!: RolesPermissionsComponent;

  errorMessage: string = '';
  userForm!: FormGroup;
  availableRoles: RoleDetail[] = [];
  showPassword: boolean = false;
  showPasswordConfirm: boolean = false;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private router: Router,
    private fb: FormBuilder,
    private userService: UserService,
    private readonly location: Location
  ) {
    this.userForm = this.fb.group({
      user_name: ['', [Validators.required, Validators.maxLength(50)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
      password_confirmation: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      status: ['Activo', Validators.required],
      roles: [[], Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadRoles();
  }
  loadRoles(): void {
    this.userService.getRoles().subscribe({
      next: (response) => {
        if (response.data?.data && Array.isArray(response.data.data)) {
          this.availableRoles = response.data.data;
        } else {
          this.availableRoles = [];
        }
      },
      error: (error) => {
        console.error('Error al cargar roles:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los roles. Por favor, intente de nuevo.',
          showConfirmButton: true
        });
      }
    });
  }

  onRegister() {
    // Validar formulario base
    if (this.userForm.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor, complete todos los campos requeridos correctamente.',
        showConfirmButton: true
      });
      return;
    }

    // Validar contraseñas coincidan
    if (this.userForm.value.password !== this.userForm.value.password_confirmation) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Las contraseñas no coinciden.',
        showConfirmButton: true
      });
      return;
    }

    // Validar roles y status desde el componente hijo
    if (!this.rolesPermissionsComponent.validateForm()) {
      return;
    }

    const selectedRoles = this.userForm.value.roles || [];
    const selectedPermissions = this.rolesPermissionsComponent.getSelectedPermissions();

    const requestBody = {
      user_name: this.userForm.value.user_name,
      email: this.userForm.value.email,
      password: this.userForm.value.password,
      password_confirmation: this.userForm.value.password_confirmation,
      status: this.userForm.value.status,
      roles: selectedRoles,
      permissions: selectedPermissions
    };


    this.userService.createUser(requestBody).subscribe({
      next: (response: any) => {
        const userId = response.data?.id || response.id;

        Swal.fire({
          icon: 'success',
          title: 'Usuario creado',
          text: response.message || 'Usuario creado correctamente.',
          showDenyButton: true,
          showCancelButton: true,
          // confirmButtonText: 'Ver Usuario',
          denyButtonText: 'Agregar Otro',
          cancelButtonText: 'Regresar',
          allowOutsideClick: false,
          allowEscapeKey: false
        }).then((result) => {
          if (result.isConfirmed) {
            // Ver Usuario - navegar a la vista del usuario creado
            if (userId) {
              this.router.navigate(['/user/show', userId]);
            } else {
              // Si no hay ID, ir al listado
              this.router.navigate(['/user/list']);
            }
          } else if (result.isDenied) {
            // Agregar Otro - limpiar el formulario para crear otro usuario
            this.resetForm();
          } else {
            // Regresar - ir al listado
            this.router.navigate(['/user/list']);
          }
        });
      },
      error: (error) => {
        console.error('Error al crear el usuario:', error);
        let errorMessage = 'Se han encontrado los siguientes errores:\n\n';

        if (error.error && error.error.errors) {
          const errors = error.error.errors;
          for (const field in errors) {
            if (errors.hasOwnProperty(field)) {
              errorMessage += `${field}: ${errors[field].join(', ')}\n\n`;
            }
          }
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else {
          errorMessage = 'Error desconocido al procesar la solicitud. Por favor, inténtelo de nuevo.';
        }

        Swal.fire({
          icon: 'error',
          title: 'Error al crear usuario',
          text: errorMessage,
          showConfirmButton: true
        });
      }
    });
  }

  private tokenKey = 'authToken';

  private getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  toggleShowPassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleShowPasswordConfirm(): void {
    this.showPasswordConfirm = !this.showPasswordConfirm;
  }


  goBack(): void {
    this.location.back();
  }

  resetForm(): void {
    // Resetear el formulario principal
    this.userForm.reset();

    // Establecer valores por defecto
    this.userForm.patchValue({
      status: 'Activo',
      roles: []
    });

    // Resetear flags de visibilidad de contraseña
    this.showPassword = false;
    this.showPasswordConfirm = false;

    // Marcar el formulario como pristine y untouched
    this.userForm.markAsPristine();
    this.userForm.markAsUntouched();
  }
}
