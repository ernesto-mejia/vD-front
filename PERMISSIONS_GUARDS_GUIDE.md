# 🔐 Guía de Permisos y Guards - EPICA Frontend

Esta guía documenta el patrón unificado de permisos y guards implementado en el frontend de EPICA.

## 📁 Estructura de Archivos por Módulo

Cada módulo debe seguir esta estructura:

```
pages/
└── [modulo]/
    ├── guards/
    │   └── [modulo]-permission.guards.ts    # Guards de permisos
    ├── services/
    │   └── [modulo]-permission.service.ts   # Servicio de permisos
    ├── [modulo].routes.ts                    # Rutas standalone (nuevo)
    ├── [modulo]-routing.module.ts            # Rutas NgModule (legacy)
    └── [modulo].module.ts                    # NgModule (legacy)
```

## 🔧 Permission Service

El servicio de permisos encapsula la lógica de verificación usando `SharedService.hasPermission()`.

### Ejemplo: `customer-permission.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { SharedService } from '../../../servicios/shared.service';

@Injectable({
  providedIn: 'root'
})
export class CustomerPermissionService {
  constructor(private sharedService: SharedService) {}

  // Permisos principales
  canViewCustomers(): boolean {
    return this.sharedService.hasPermission('clients', '', 'view');
  }

  canCreateCustomers(): boolean {
    return this.sharedService.hasPermission('clients', '', 'create');
  }

  canEditCustomers(): boolean {
    return this.sharedService.hasPermission('clients', '', 'edit');
  }

  canDeleteCustomers(): boolean {
    return this.sharedService.hasPermission('clients', '', 'delete');
  }

  // Permisos de subrecursos
  canViewCustomerAddresses(): boolean {
    return this.sharedService.hasPermission('clients', 'addresses', 'view');
  }
}
```

### Patrón de Nombres de Permisos

```
sharedService.hasPermission(module, submodule, action)
```

| Parámetro | Descripción | Ejemplos |
|-----------|-------------|----------|
| `module` | Módulo principal | `'clients'`, `'providers'`, `'purchases'` |
| `submodule` | Subrecurso (vacío si no aplica) | `'addresses'`, `'contacts'`, `''` |
| `action` | Acción a verificar | `'view'`, `'create'`, `'edit'`, `'delete'` |

---

## 🛡️ Guards

Los guards usan `CanActivateFn` (patrón funcional de Angular 17+).

### Ejemplo: `customer-permission.guards.ts`

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CustomerPermissionService } from '../services/customer-permission.service';
import Swal from 'sweetalert2';

export const CustomerListGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(CustomerPermissionService);
  const router = inject(Router);

  if (permissionService.canViewCustomers()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para ver clientes.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

export const CustomerCreateGuard: CanActivateFn = (route, state) => {
  // ... similar pattern
};
```

### Convención de Nombres de Guards

| Guard | Propósito |
|-------|-----------|
| `[Entity]ListGuard` | Listar entidades |
| `[Entity]ViewGuard` | Ver detalle |
| `[Entity]CreateGuard` | Crear nueva |
| `[Entity]EditGuard` | Editar existente |
| `[Entity]DeleteGuard` | Eliminar |

---

## 🛤️ Rutas Standalone (Recomendado)

### Ejemplo: `customers.routes.ts`

```typescript
import { Routes } from '@angular/router';
import { AuthGuard } from '../../../auth.guard';
import {
  CustomerListGuard,
  CustomerViewGuard,
  CustomerCreateGuard,
  CustomerEditGuard
} from './guards/customer-permission.guards';

export const customersRoutes: Routes = [
  {
    path: 'list',
    loadComponent: () => import('./customers-list/customers-list.component')
      .then(m => m.CustomersListComponent),
    canActivate: [AuthGuard, CustomerListGuard]
  },
  {
    path: 'add',
    loadComponent: () => import('./customer-add/customer-add.component')
      .then(m => m.CustomerAddComponent),
    canActivate: [AuthGuard, CustomerCreateGuard]
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./customer-edit/customer-edit.component')
      .then(m => m.CustomerEditComponent),
    canActivate: [AuthGuard, CustomerEditGuard]
  },
  {
    path: 'show/:id',
    loadComponent: () => import('./customer-show/customer-show.component')
      .then(m => m.CustomerShowComponent),
    canActivate: [AuthGuard, CustomerViewGuard]
  }
];
```

### Registro en `app.routes.ts`

```typescript
{
  path: 'customers',
  loadChildren: () => import('./pages/customers/customers.routes')
    .then(m => m.customersRoutes)
}
```

---

## 📋 Módulos Implementados

| Módulo | Permission Service | Guards | Rutas Standalone |
|--------|-------------------|--------|------------------|
| Customers | ✅ | ✅ | 🔄 Pendiente |
| Providers | ✅ | ✅ | 🔄 Pendiente |
| Notifications | ✅ | ✅ | ✅ |
| Logs | ✅ | ✅ | ✅ |
| Taxes | ✅ | ✅ | ✅ |
| Purchase Requests | ✅ | ✅ | ✅ |
| Purchase Orders | ✅ | ✅ | ✅ |
| Contracts Clients | ✅ | ✅ | ✅ |
| Contracts Providers | ✅ | ✅ | ✅ |

---

## 🔄 Migración de NgModule a Standalone

### Antes (NgModule):

```typescript
// app.routes.ts
{
  path: 'customers',
  loadChildren: () => import('./pages/customers/customers.module')
    .then(m => m.CustomersModule)
}
```

### Después (Standalone):

```typescript
// app.routes.ts
{
  path: 'customers',
  loadChildren: () => import('./pages/customers/customers.routes')
    .then(m => m.customersRoutes)
}
```

---

## ⚡ Checklist para Nuevos Módulos

- [ ] Crear `services/[modulo]-permission.service.ts`
- [ ] Crear `guards/[modulo]-permission.guards.ts`
- [ ] Crear `[modulo].routes.ts` con rutas standalone
- [ ] Usar `loadComponent` para lazy loading de componentes
- [ ] Aplicar `[AuthGuard, PermissionGuard]` a cada ruta
- [ ] Registrar en `app.routes.ts` usando `loadChildren`

---

## 🧪 Testing

Ver archivo `GUARDS_TESTING_GUIDE.md` para la guía de testing de guards.

---

## 📚 Referencias

- [Angular Standalone Components](https://angular.io/guide/standalone-components)
- [Angular Guards](https://angular.io/guide/router#preventing-unauthorized-access)
- [Spatie Laravel Permission](https://spatie.be/docs/laravel-permission)
