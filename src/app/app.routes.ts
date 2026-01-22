import { Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthGuard } from './auth.guard';

import { LoginComponent } from './pages/login/login.component';
import { LayoutComponent } from './pages/layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UnderConstructionComponent } from './pages/under_construction/under_construction.component';
import { NotificationsInboxComponent } from './pages/parameters/notifications/notifications-inbox/notifications-inbox.component';
import { NotificationDetailComponent } from './pages/parameters/notifications/notification-detail/notification-detail.component';
import { NotificationsAdminComponent } from './pages/parameters/notifications/admin/notifications-admin.component';
import { NotificationEditComponent } from './pages/parameters/notifications/admin/notification-edit/notification-edit.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [AuthGuard],
      },
      //JRD - User Routes
      {
        path: 'users',  // Path padre para las rutas de roles
        loadChildren: () => import('./pages/users/user/user.module').then(m => m.UserModule)
      },

      {
        path: 'under_construction',
        component: UnderConstructionComponent,
          canActivate: [AuthGuard],
      },

      // EMC Customers Module
      {
        path: 'customers',  // Path padre para las rutas de customers
        loadChildren: () => import('./pages/customers/customers.module').then(m => m.CustomersModule)
      },

      // EMC customer V2 Module
      {
        path: 'customersv2',  // Path padre para las rutas de customers
        loadChildren: () => import('./pages/sales/customers/customers.module').then(m => m.CustomersModule)
      },
      // EMC Products Module
      {
        path: 'products',  // Path padre para las rutas de products
        loadChildren: () => import('./pages/warehouse/products/products.module').then(m => m.ProductsModule)
      },

      //EMC Providers Module
      {
         path: 'providers', // Path padre para las rutas de providers
        loadChildren: () =>
          import('./pages/providers/providers.module').then(
            (m) => m.ProvidersModule
          ),
      },

      //EMC Services Module
      {
        path: 'services', // Path padre para las rutas de services
        loadChildren: () =>
          import('./pages/services/services.module').then(
            (m) => m.ServicesModule
          ),
      },

      //EMC Roles Module
      {
        path: 'roles',  // Path padre para las rutas de roles
        loadChildren: () => import('./pages/users/role/role.module').then(m => m.RoleModule)
      },
      //EMC Permisos Module
      {
        path: 'permissions',  // Path padre para las rutas de permisos
        loadChildren: () => import('./pages/users/permission/permission.module').then(m => m.PermissionModule)
      },

      //EMC Notificaciones Module (Standalone Routes)
      {
        path: 'notifications',
        loadChildren: () => import('./pages/parameters/notifications/notifications.routes').then(m => m.notificationsRoutes)
      },

      //EMC Logs Acciones Module (Standalone Routes)
      {
        path: 'logs',
        loadChildren: () => import('./pages/parameters/logs/logs.routes').then(m => m.logsRoutes)
      },
      // EMC Contratos de Clientes Module (Purchases)
      {
        path: 'purchases/contracts-clients',
        loadChildren: () =>
          import(
            './pages/purchases/contracts-clients/contracts-clients.module'
          ).then((m) => m.ContractsClientsModule),
      },
      // EMC Licitaciones (Standalone Routes)
      {
        path: 'purchases/licitations',
        loadChildren: () => import('./pages/purchases/licitations/licitations.routes').then(m => m.licitationsRoutes)
      },

      // EMC Pruebas Module
      {
        path: 'pruebas',
        loadChildren: () =>
          import('./pages/pruebas/pruebas.module').then((m) => m.PruebasModule),
      },
      // EMC Contratos de Proveedores (Standalone Routes)
      {
        path: 'purchases/contracts-providers',
        loadChildren: () => import('./pages/purchases/contracts-providers/contracts-providers.routes').then(m => m.contractsProvidersRoutes)
      },

      // EMC Pruebas Module
      {
        path: 'pruebas',
        loadChildren: () =>
          import('./pages/pruebas/pruebas.module').then((m) => m.PruebasModule),
      },

      // Activos Fijos Module
      {
        path: 'fixed-assets',
        loadChildren: () =>
          import('./pages/warehouse/fixed-assets/fixed-assets.module').then(
            (m) => m.FixedAssetsModule
          ),
      },

      // Notas de Entrada Module (Warehouses)
      {
        path: 'entry-notes',
        loadChildren: () =>
          import('./pages/warehouse/entry-notes/entry-notes.module').then(
            (m) => m.EntryNotesModule
          ),
      },

      // EMC Solicitudes de Compra Module (Purchases)
      {
        path: 'purchases/purchase-requests',
        loadChildren: () =>
          import(
            './pages/purchases/purchase-requests/purchase-requests-routing.module'
          ).then((m) => m.PurchaseRequestsRoutingModule),
      },

      // EMC Órdenes de Compra (Standalone Routes)
      {
        path: 'purchases/purchase-orders',
        loadChildren: () => import('./pages/purchases/purchase-orders/purchase-orders.routes').then(m => m.purchaseOrdersRoutes)
      },

      // EMC Órdenes de Recepción - Almacén (Standalone Routes)
      {
        path: 'warehouse/reception-orders',
        loadChildren: () => import('./pages/warehouse/reception-orders/reception-orders.routes').then(m => m.receptionOrdersRoutes)
      },
        // EMC Lista de Precios de Compra Module
      {
        path: 'purchases/purchase-price-list',
        loadChildren: () =>
          import('./pages/purchases/purchase-price-list/purchase-price-list.module').then(
            (m) => m.PurchasePriceListModule
          ),
      },

      // EMC Impuestos (Taxes) - Standalone Routes
      {
        path: 'parameters/taxes',
        loadChildren: () => import('./pages/parameters/taxes/taxes.routes').then(m => m.taxesRoutes)
      },

      // EMC Servicios de Comunicación - Standalone Routes
      {
        path: 'parameters/communication',
        loadChildren: () => import('./pages/parameters/communication/communication.routes').then(m => m.communicationRoutes)
      },

      // EMC Recursos Humanos (HR) Module
      {
        path: 'hr',
        loadChildren: () =>
          import('./pages/hr/hr.routes').then((m) => m.hrRoutes),
        canActivate: [AuthGuard],
      },

      // Sales - Customers (global CRUD)
      // {
      //   path: 'sales/customers/list',
      //   component: SalesCustomerListComponent,
      //   canActivate: [AuthGuard]
      // },
      // {
      //   path: 'sales/customers/add',
      //   component: SalesCustomerAddComponent,
      //   canActivate: [AuthGuard]
      // },
      // {
      //   path: 'sales/customers/edit/:id',
      //   component: SalesCustomerEditComponent,
      //   canActivate: [AuthGuard]
      // },
      // {
      //   path: 'sales/customers/show/:id',
      //   component: SalesCustomerShowComponent,
      //   canActivate: [AuthGuard]
      // },

    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
