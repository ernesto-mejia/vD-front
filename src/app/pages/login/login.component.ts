import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../auth.service';
import Swal from 'sweetalert2';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, delay, mergeMap, retryWhen, scan } from 'rxjs/operators';

import { SharedService } from '../../servicios/shared.service';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  public thispubliccatalog: any[] = [];

  isLoginView: boolean = true;
  errorMessage: string = '';
  user_id: string = ''; // ID del usuario
  email: string = ''; // Email del usuario
  returnUrl: string = '/dashboard';

  userLogin: any = {
    userName: '',
    password: '',
  };

  passwordVisible: boolean = false; // Controla la visibilidad de la contraseña

  private route = inject(ActivatedRoute);

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private sharedService: SharedService // Inyectar SharedService
  ) {}
  router = inject(Router);

  ngOnInit(): void {
    // Verificar si hay parámetros de sesión expirada
    this.route.queryParams.subscribe(params => {
      if (params['expired'] === 'true') {
        Swal.fire({
          icon: 'warning',
          title: 'Sesión expirada',
          text: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#3085d6'
        });
      }

      // Guardar URL de retorno si existe
      if (params['returnUrl']) {
        this.returnUrl = params['returnUrl'];
      }
    });

    // Solo verificar sesión si no viene de expiración
    if (!this.route.snapshot.queryParams['expired']) {
      this.checkSession();
    }
  }

  // Función para alternar la visibilidad de la contraseña
  onPasswordVisibilityToggle(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  // Verificar si el token es válido o está presente
  private checkSession(): void {
    const isAuthenticated = this.authService.isAuthenticated();
    if (!isAuthenticated) {
      Swal.fire({
        icon: 'warning',
        title: 'La sesión ha expirado',
        text: 'Por favor, inicia sesión para continuar.',
        confirmButtonText: 'OK',
      }).then(() => {
        this.router.navigate(['/login']); // Redirigir al login
      });
    }
  }

  // Login del usuario
  onLogin() {
    if (this.userLogin.userName && this.userLogin.password) {
      Swal.fire({
        title: 'Iniciando sesión...',
        text: 'Por favor, espere',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading(null); // Muestra el spinner de carga
        },
      });

      this.authService
        .login(this.userLogin.userName, this.userLogin.password)
        .subscribe(
          async (response: any) => {
            if (response.success) {
               const fakeToken = response.token; // Token ficticio
              this.user_id = response.user_id; // Guardamos el ID del usuario
              this.email = response.email || response.user_email || ''; // Guardamos el email del usuario
              this.authService.setToken(fakeToken,this.user_id); // Guardamos el token ficticio
              this.sharedService.updateUserName(this.email); // Actualizamos el email después de setToken

              // *** CRÍTICO: Cargar permisos del usuario después del login ***
              await this.loadpubliccatalogs();

              try {
                // Redirige al dashboard o a la URL de retorno
                Swal.close(); // Cierra el spinner

                this.router.navigate([this.returnUrl]);

                // Mensaje de éxito opcional
                Swal.fire({
                  icon: 'success',
                  title: 'Inicio de sesión exitoso',
                  text: 'Bienvenido al panel de control.',
                  timer: 1500,
                  showConfirmButton: false,
                });
              } catch (error) {
                // Manejo de errores al cargar los datos
                Swal.fire({
                  icon: 'error',
                  title: 'Error al cargar datos',
                  text: 'Hubo un problema al preparar tu entorno. Intenta nuevamente más tarde.',
                });
              }
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Inicio de sesión fallido',
                text: 'Por favor, inténtalo nuevamente.',
              });
            }
          },
          (error) => {
            Swal.close(); // Cierra el spinner en caso de error
            const errorMessage =
              error.status === 401
                ? 'Credenciales incorrectas. Por favor, verifique su usuario y contraseña.'
                : 'Ocurrió un error en el login. Intente más tarde.';
            Swal.fire({
              icon: 'error',
              title: 'Error en el login',
              text: errorMessage,
            });
          }
        );
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor ingrese todos los campos.',
      });
    }
  }

  // Método para cargar catálogos públicos y permisos del usuario
  public loadpubliccatalogs(): Promise<void> {
    return new Promise((resolve, reject) => {
      const userId = Number(this.user_id);

      if (!userId) {
        console.error('No se pudo obtener el ID del usuario');
        resolve();
        return;
      }

      // Cargar permisos del usuario
      this.authService.getRolUser(userId).subscribe({
        next: (response: any) => {
          if (response.ok && response.data) {
            // Guardar permisos del usuario en localStorage
            localStorage.setItem('user_permissions', JSON.stringify(response.data));
            // Recargar permisos en el servicio compartido
            this.sharedService.reloadPermissions();
          }
          resolve();
        },
        error: (error: any) => {
          console.error('Error al cargar permisos del usuario:', error);
          resolve(); // Continuar aunque falle la carga de permisos
        }
      });
    });
  }

  private getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  canAccessModule(moduleName: string, submoduleName: string, action: string): boolean {
    return this.authService.hasPermission(moduleName, submoduleName, action);
  }
}
