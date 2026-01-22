import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserPermissionService } from '../services/user-permission.service';
import Swal from 'sweetalert2';

// Guard para ver usuarios
export const UserListGuard: CanActivateFn = (route, state) => {
  const userPermissionService = inject(UserPermissionService);
  const router = inject(Router);

  if (userPermissionService.canListUsers()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para ver usuarios.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

export const UserViewGuard: CanActivateFn = (route, state) => {
  const userPermissionService = inject(UserPermissionService);
  const router = inject(Router);

  if (userPermissionService.canViewUsers()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para ver usuarios.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para crear usuarios
export const UserCreateGuard: CanActivateFn = (route, state) => {
  const userPermissionService = inject(UserPermissionService);
  const router = inject(Router);

  if (userPermissionService.canCreateUsers()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para crear usuarios.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para editar usuarios
export const UserEditGuard: CanActivateFn = (route, state) => {
  const userPermissionService = inject(UserPermissionService);
  const router = inject(Router);

  if (userPermissionService.canEditUsers()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para editar usuarios.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para manejar roles
export const UserManageRolesGuard: CanActivateFn = (route, state) => {
  const userPermissionService = inject(UserPermissionService);
  const router = inject(Router);

  if (userPermissionService.canManageRoles()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para gestionar roles de usuarios.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para manejar permisos
export const UserManagePermissionsGuard: CanActivateFn = (route, state) => {
  const userPermissionService = inject(UserPermissionService);
  const router = inject(Router);

  if (userPermissionService.canManagePermissions()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para gestionar permisos de usuarios.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard combinado para edición completa (incluye roles y permisos)
export const UserFullEditGuard: CanActivateFn = (route, state) => {
  const userPermissionService = inject(UserPermissionService);
  const router = inject(Router);

  const canEdit = userPermissionService.canEditUsers();
  const canManageRoles = userPermissionService.canManageRoles();
  const canManagePermissions = userPermissionService.canManagePermissions();

  // Debe tener al menos permiso de edición
  if (canEdit) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para editar usuarios.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};
