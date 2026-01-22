import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import { inject } from '@angular/core';

export const AuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si el usuario está autenticado, permite el acceso
  if (authService.isAuthenticated()) {
    return true;  
  } else {
    // Si no está autenticado, redirige al login y espera que la navegación se complete
    router.navigate(['/login']);
    return false;  // Deniega el acceso
  }
};
