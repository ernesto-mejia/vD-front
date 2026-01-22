import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import Swal from 'sweetalert2';
import { AuthService } from '../../../../auth.service';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { apiEndpoint } from '../../../../shared/api-endpoint.util';
import { UserService } from '../user.service';
import { Subject, takeUntil } from 'rxjs';
import { RolesPermissionsComponent } from '../roles-permissions/roles-permissions.component';

@Component({
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.css'],
})
export class UserEditComponent implements OnInit, OnDestroy {
  @ViewChild(RolesPermissionsComponent)
  rolesPermissionsComponent!: RolesPermissionsComponent;

  get permisos(): FormArray {
    return this.userForm.get('permisos') as FormArray;
  }

  errorMessage: string = '';
  userForm!: FormGroup;
  userId: string = '';
  user: any = null;
  roles: any[] = [];
  initialPermissions: any[] = [];
  userRoles: any[] = [];
  userDirectPermissions: string[] = [];
  userEffectivePermissions: string[] = [];
  canViewRoles: boolean = true; // Indica si el usuario puede ver los roles

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private router: Router,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private readonly userService: UserService
  ) {
    this.userForm = this.fb.group({
      user_name: ['', Validators.required],
      name: [''],
      last_name: [''],
      phone: [''],
      email: ['', [Validators.required, Validators.email]],
      password: [''], // Password opcional para actualizaciones
      password_confirmation: [''],
      role: [''],
      roles: [[], Validators.required],
      status: ['', Validators.required],
      permisos: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    // Cargar roles primero, luego inicializar el componente
    this.loadRoles();
    this.initializeComponent();
  }

  private initializeComponent(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe({
      next: (params) => {
        this.userId = params['userId'];
        if (this.userId) {
          this.loadUserData();
        } else {
          console.error('ID de usuario no válido');
        }
      },
      error: (error) => {
        console.error('Error al obtener parámetros de ruta:', error);
      },
    });
  }

  loadUserData(): void {
    this.userService.getUser(+this.userId).subscribe({
      next: (response: any) => {
        if (response.ok && response.data) {
          this.user = response.data.user;
          this.userRoles = response.data.roles || [];
          this.userDirectPermissions = response.data.direct_permissions || [];
          this.userEffectivePermissions = response.data.effective_permissions || [];

          // Extraer nombres de roles para el formulario
          const roleNames = this.userRoles.length > 0
            ? this.userRoles.map((r: any) => r.name)
            : [];

          // Actualizar formulario con datos del usuario
          this.userForm.patchValue({
            user_name: this.user.user_name,
            name: this.user.name || '',
            last_name: this.user.last_name || '',
            phone: this.user.phone || '',
            email: this.user.email,
            roles: roleNames,
            status: this.user.status || 'Activo'
          });

          // Establecer permisos iniciales para el componente roles-permissions
          // Usamos los permisos directos del usuario
          this.initialPermissions = this.userDirectPermissions.map(permission => ({
            name: permission
          }));
        }
      },
      error: (error) => {
        console.error('Error al cargar los usuarios:', error);
        this.errorMessage =
          'Error al cargar los detalles del usuario. Por favor, inténtelo de nuevo.';
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar la información del usuario',
          showConfirmButton: true,
        });
      },
    });
  }

  // Métodos loadPermissions y loadDefaultPermissions eliminados por limpieza, ya no se usan.

  toggleCheckboxes(event: any, id: string): void {
    const isChecked = event.target.checked;
    const checkboxes = document.querySelectorAll(
      `[data-view-id="${id}"], [data-add-id="${id}"], [data-edit-id="${id}"], [data-delete-id="${id}"]`
    );

    checkboxes.forEach((checkbox: any) => {
      checkbox.checked = isChecked;
      // Actualizar el FormControl correspondiente
      const controlName = checkbox.getAttribute('formControlName');
      const index = this.permisos.controls.findIndex(
        (ctrl: any) =>
          ctrl.value.module_id + '_' + ctrl.value.submodule_id === id
      );
      if (index !== -1) {
        this.permisos.at(index).get(controlName)?.setValue(isChecked);
      }
    });
  }

  handleCheckboxChange(event: any, id: string): void {
    const index = this.permisos.controls.findIndex(
      (ctrl: any) => ctrl.value.module_id + '_' + ctrl.value.submodule_id === id
    );

    if (index !== -1) {
      const permission = this.permisos.at(index);
      const allChecked =
        permission.get('view')?.value &&
        permission.get('add')?.value &&
        permission.get('edit')?.value &&
        permission.get('delete')?.value;

      permission.get('fullright')?.setValue(allChecked, { emitEvent: false });
    }
  }

  onSubmit() {
    // Validar formulario base
    if (this.userForm.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor, complete todos los campos requeridos correctamente.',
        showConfirmButton: true,
      });
      return;
    }

    // Validar roles y status desde el componente hijo
    if (!this.rolesPermissionsComponent.validateForm()) {
      return;
    }

    const formValue = this.userForm.value;
    const selectedPermissions =
      this.rolesPermissionsComponent.getSelectedPermissions();

    // Construir el objeto de solicitud según la estructura requerida
    const requestBody: any = {
      user_name: formValue.user_name,
      email: formValue.email,
      status: formValue.status,
      roles: formValue.roles, // Array de nombres de roles
      permissions: selectedPermissions // Permisos directos como array
    };

    // Agregar campos opcionales solo si tienen valor
    if (formValue.name) requestBody.name = formValue.name;
    if (formValue.last_name) requestBody.last_name = formValue.last_name;
    if (formValue.phone) requestBody.phone = formValue.phone;

    // Agregar password solo si se proporcionó
    if (formValue.password && formValue.password.trim() !== '') {
      if (formValue.password !== formValue.password_confirmation) {
        Swal.fire({
          icon: 'error',
          title: 'Error de contraseña',
          text: 'La contraseña y su confirmación no coinciden.',
          showConfirmButton: true
        });
        return;
      }
      requestBody.password = formValue.password;
      requestBody.password_confirmation = formValue.password_confirmation;
    }


    const headers = { 'Authorization': `Bearer ${this.getToken()}` };

    this.userService.updateUser(this.userId, requestBody)
      .subscribe(
        (response: any) => {
          Swal.fire({
            icon: 'success',
            title: 'Usuario Actualizado',
            text:
              response.message ||
              'La información del usuario se actualizó correctamente',
            timer: 3000,
            showConfirmButton: false,
          }).then(() => {
            this.router.navigate(['/users/list']);
          });
        },
        (error) => {
          console.error('Error al actualizar el usuario:', error);

          let errorMessage = 'Se han encontrado los siguientes errores:\n\n';

          if (error.error && error.error.errors) {
            const errors = error.error.errors;
            for (const field in errors) {
              if (errors.hasOwnProperty(field)) {
                errorMessage += `${field}: ${errors[field].join(', ')}\n\n`;
              }
            }
          } else {
            errorMessage +=
              'Error desconocido al procesar la solicitud. Por favor, inténtelo de nuevo.';
          }

          Swal.fire({
            icon: 'error',
            title: 'Error al actualizar usuario',
            text: errorMessage,
            showConfirmButton: true,
          });
        }
      );
  }

  private tokenKey = 'authToken'; // Clave para almacenar el token
  private getToken(): string | null {
    return localStorage.getItem(this.tokenKey); // Obtener el token guardado
  }

  goBack() {
    this.router.navigate(['/users/list']);
  }

  loadRoles(): void {
    this.userService
      .getRoles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data && response.data.data) {
            this.roles = response.data.data;
            this.canViewRoles = true;

            // Después de cargar los roles, cargar datos del usuario si tenemos el ID
            if (this.userId) {
              this.loadUserData();
            }
          }
        },
        error: (error) => {
          console.error('Error al cargar roles:', error);

          // Si es error 403 (Forbidden), simplemente ocultar la sección de roles
          if (error.status === 403) {
            this.canViewRoles = false;
            // Quitar la validación required del campo roles ya que el usuario no puede verlos
            this.userForm.get('roles')?.clearValidators();
            this.userForm.get('roles')?.updateValueAndValidity();
            // Aún así cargar datos del usuario si tenemos el ID
            if (this.userId) {
              this.loadUserData();
            }
          } else {
            // Solo mostrar alerta para otros tipos de errores
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudieron cargar los roles disponibles',
            });
          }
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
