 import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      return true; // Permitir acceso si el usuario está autenticado
    } else {
      // Mostrar alerta y redirigir al login
      Swal.fire({
        icon: 'warning',
        title: 'La sesión ha expirado',
        text: 'Por favor, inicia sesión para continuar.',
        confirmButtonText: 'OK'
      }).then(() => {
        this.router.navigate(['/login']); // Redirigir al login
      });
      return false; // Bloquear acceso
    }
  }
}