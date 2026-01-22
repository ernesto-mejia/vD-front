import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { CommonModule, Location } from '@angular/common';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, delay, mergeMap, retryWhen, scan } from 'rxjs/operators';
import { SharedService } from '../../servicios/shared.service'; // Importar el servicio compartido
import { apiEndpoint } from '../../shared/api-endpoint.util';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-content-menu',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './content-menu.component.html',
  styleUrl: './content-menu.component.css',
})
export class ContentMenuComponent implements OnInit {
  activeSection: string | null = null;
  activeSubSection: string | null = null;
  openDropdown: string | null = null; // Para controlar dropdown abierto en móvil
  xuser_name: any = 'Desconocido';
  idUser: any = null;
  users: boolean = false;
  modulesVisible: Record<string, boolean> = {};
  inventories: boolean = false;
  providers: boolean = false;
  sales: boolean = false;
  inventory: boolean = false;

  operations_licitations: boolean = false;
  operations_authorizations: boolean = false;
  operations_cpm: boolean = false;

  planning_authorizations: boolean = false;
  planning_homologuedstudies: boolean = false;
  planning_testkits: boolean = false;
  planning_purchaserequest: boolean = false;
  planning_cpm: boolean = false;
  planning_contractswithproviders: boolean = false;
  planning_contractswithcustomers: boolean = false;

  sales_pricelist: boolean = false;
  sales_fullaccess: boolean = false;
  sales_customers: boolean = false;
  sales_billables: boolean = false;
  sales_salesdocuments: boolean = false;
  sales_fulfillmentorders: boolean = false;
  sales_invoices: boolean = false;
  sales_remitorders: boolean = false;

  purchases_payables: boolean = false;
  purchases_returns: boolean = false;
  purchases_services: boolean = false;
  purchases_operations: boolean = false;
  purchases_pricelist: boolean = false;
  purchases_contracts_clients: boolean = false;
  purchases_contracts_providers: boolean = false;
  purchases_purchasedocuments: boolean = false;
  purchases_providers: boolean = false;
  purchases_purchase_requests: boolean = false;
  purchases_purchase_requests_authorize: boolean = false;
  purchases_purchase_requests_preauthorize: boolean = false;
  purchases_purchase_orders: boolean = false;
  purchases_licitations: boolean = false;

  parameters_users = false;
  parameters_roles = false;
  parameters_permissions = false;
  parameters_owner = false;
  parameters_barcodes = false;
  parameters_tickets = false;
  parameters_support = false;
  parameters_control = false;
  parameters_taxes = false;

  quality_quarantine: boolean = false;
  quality_placement: boolean = false;
  quality_relocation: boolean = false;
  quality_adjustments: boolean = false;

  warehouses_fullaccess: boolean = false;
  warehouses_studies: boolean = false;
  warehouses_reports: boolean = false;
  warehouses_physicalinventory: boolean = false;
  warehouses_products: boolean = false;
  warehouses_tests: boolean = false;
  warehouses_kits: boolean = false;
  warehouses_fixedassets: boolean = false;
  warehouses_transactions: boolean = false;
  warehouses_transferdocuments: boolean = false;
  warehouses_remitorders: boolean = false;
  warehouses_requestorders: boolean = false;
  warehouses_businessunits: boolean = false;
  warehouses_medicalunitdocuments: boolean = false;
  warehouses_specialties: boolean = false;
  warehouses_inventorydocuments: boolean = false;
  warehouses_inventory: boolean = false;
  warehouses_quarantine: boolean = false;
  warehouses_receptionorders: boolean = false;

  // Catálogos
  catalog_services: boolean = false;
  catalog_pruebas: boolean = false;

  logistics_fullaccess: boolean = false;
  logistics_fulfillmentlists: boolean = false;
  logistics_deliveryconfirmation: boolean = false;
  logistics_shipping: boolean = false;

  calendar_PhysicalInventory: boolean = false;
  calendar_maintenance: boolean = false;
  calendar_productreception: boolean = false;
  calendar_serviceplanning: boolean = false;

  human_resources_fullaccess: boolean = false;
  human_resources_areas: boolean = false;
  human_resources_departments: boolean = false;
  human_resources_incidents: boolean = false;
  human_resources_payroll: boolean = false;
  human_resources_jobpositions: boolean = false;
  human_resources_contracts: boolean = false;
  human_resources_vacations: boolean = false;
  human_resources_leaves: boolean = false;
  human_resources_attendance: boolean = false;
  human_resources_disabilities: boolean = false;
  human_resources_loans: boolean = false;

  private permissionsSubscription: Subscription | undefined;

  constructor(
    private http: HttpClient,
    private location: Location,
    public sharedService: SharedService
  ) {}

  ngOnInit(): void {
    const savedSection = localStorage.getItem('activeSection');
    if (savedSection) {
      this.activeSection = savedSection;
    }
    this.sharedService.reloadPermissions();

    this.activeSection = localStorage.getItem('activeSection');
    this.activeSubSection = localStorage.getItem('activeSubSection');
    this.idUser = localStorage.getItem('user_id');

    this.sharedService.userName$.subscribe((userName) => {
      this.xuser_name = userName || 'Desconocido';
    });

    this.permissionsSubscription = this.sharedService.permissions$.subscribe(
      () => {
        this.updateModulesVisibility();
      }
    );

    this.updateModulesVisibility();

    this.modulesVisible = {
      operations: this.sharedService.hasAnyPermissionInModule('operations'),
      planning: this.sharedService.hasAnyPermissionInModule('planning'),
      sales: this.sharedService.hasAnyPermissionInModule('sales'),
      purchases: this.sharedService.hasAnyPermissionInModule('purchases'),
      quality: this.sharedService.hasAnyPermissionInModule('quality'),
      warehouses: this.sharedService.hasAnyPermissionInModule('warehouses'),
      logistics: this.sharedService.hasAnyPermissionInModule('logistics'),
      human_resource:
        this.sharedService.hasAnyPermissionInModule('human_resources'),
      calendar: this.sharedService.hasAnyPermissionInModule('calendar'),
      references: this.sharedService.hasAnyPermissionInModule('references'),
      parameters: this.sharedService.hasAnyPermissionInModule('parameters'),
    };
  }

  ngOnDestroy(): void {
    if (this.permissionsSubscription) {
      this.permissionsSubscription.unsubscribe();
    }
  }

  updateModulesVisibility(): void {
    const modules = [
      { key: 'operations', name: 'operations' },
      { key: 'planning', name: 'planning' },
      { key: 'sales', name: 'sales' },
      { key: 'purchases', name: 'purchases' },
      { key: 'quality', name: 'quality' },
      { key: 'warehouses', name: 'warehouses' },
      { key: 'logistics', name: 'logistics' },
      { key: 'human_resource', name: 'human_resources' },
      { key: 'calendar', name: 'calendar' },
      { key: 'parameters', name: 'parameters' },
      { key: 'references', name: 'references' },
    ];

    this.modulesVisible = {};
    modules.forEach((mod) => {
      this.modulesVisible[mod.key] =
        this.sharedService.hasAnyPermissionInModule(mod.name);
    });

    const submodules = [
      {
        key: 'operations_licitations',
        module: 'operations',
        submodule: 'licitations',
      },
      {
        key: 'operations_authorizations',
        module: 'operations',
        submodule: 'authorizations',
      },
      { key: 'operations_cpm', module: 'operations', submodule: 'cpm' },

      {
        key: 'planning_authorizations',
        module: 'planning',
        submodule: 'authorizations',
      },
      {
        key: 'planning_homologuedstudies',
        module: 'planning',
        submodule: 'homologued studies',
      },
      { key: 'planning_testkits', module: 'planning', submodule: 'test kits' },
      {
        key: 'planning_purchaserequest',
        module: 'planning',
        submodule: 'purchase request',
      },
      { key: 'planning_cpm', module: 'planning', submodule: 'cpm' },
      {
        key: 'planning_contractswithproviders',
        module: 'planning',
        submodule: 'contracts with providers',
      },
      {
        key: 'planning_contractswithcustomers',
        module: 'planning',
        submodule: 'contracts with customers',
      },

      { key: 'sales_fullaccess', module: 'sales', submodule: 'full access' },
      // Para clientes, verificamos directamente el módulo 'clients' ya que los permisos vienen como 'clients.action'
      { key: 'sales_customers', module: 'clients', submodule: '' },
      { key: 'sales_billables', module: 'sales', submodule: 'billables' },
      {
        key: 'sales_salesdocuments',
        module: 'sales',
        submodule: 'sales documents',
      },
      {
        key: 'sales_fulfillmentorders',
        module: 'sales',
        submodule: 'fulfillment orders',
      },
      { key: 'sales_invoices', module: 'sales', submodule: 'invoices' },
      { key: 'sales_remitorders', module: 'sales', submodule: 'remit orders' },

      { key: 'purchases_payables', module: 'purchases', submodule: 'payables' },
      { key: 'purchases_returns', module: 'purchases', submodule: 'returns' },
      { key: 'purchases_services', module: 'purchases', submodule: 'services' },
      {
        key: 'purchases_operations',
        module: 'purchases',
        submodule: 'operations',
      },
      // Lista de Precios de Compra - permisos como 'purchase-price-lists.action' o 'purchases.price list.action'
      {
        key: 'purchases_pricelist',
        module: 'purchase-price-lists',
        submodule: '',
      },
      // Licitaciones - permisos como 'licitations.action'
      {
        key: 'purchases_licitations',
        module: 'licitations',
        submodule: '',
      },
      // Contratos de Clientes - permisos como 'contracts-clients.action'
      {
        key: 'purchases_contracts_clients',
        module: 'contracts-clients',
        submodule: '',
      },
      // Contratos de Proveedores - permisos como 'contracts-providers.action'
      {
        key: 'purchases_contracts_providers',
        module: 'contracts-providers',
        submodule: '',
      },
      // Solicitudes de Compra - permisos como 'purchase-requests.action'
      {
        key: 'purchases_purchase_requests',
        module: 'purchase-requests',
        submodule: '',
      },
      // Autorizar Solicitudes de Compra - permiso authorize-simple
      {
        key: 'purchases_purchase_requests_authorize',
        module: 'purchase-requests',
        submodule: 'authorize-simple',
      },
      // Pre-autorizar Solicitudes de Compra - permiso específico
      {
        key: 'purchases_purchase_requests_preauthorize',
        module: 'purchase-requests',
        submodule: 'pre-authorize',
      },
      // Órdenes de Compra - permisos como 'purchase-orders.action'
      {
        key: 'purchases_purchase_orders',
        module: 'purchase-orders',
        submodule: '',
      },
      {
        key: 'purchases_purchasedocuments',
        module: 'purchases',
        submodule: 'purchase documents',
      },
      // Para proveedores, verificamos directamente el módulo 'providers' ya que los permisos vienen como 'providers.action'
      {
        key: 'purchases_providers',
        module: 'providers',
        submodule: '',
      },

      { key: 'quality_quarantine', module: 'quality', submodule: 'quarentine' },
      { key: 'quality_placement', module: 'quality', submodule: 'placement' },
      { key: 'quality_relocation', module: 'quality', submodule: 'relocation' },
      {
        key: 'quality_adjustments',
        module: 'quality',
        submodule: 'adjustments',
      },

      { key: 'warehouses_studies', module: 'warehouses', submodule: 'studies' },
      {
        key: 'warehouses_fullaccess',
        module: 'warehouses',
        submodule: 'full access',
      },
      { key: 'warehouses_reports', module: 'warehouses', submodule: 'reports' },
      {
        key: 'warehouses_physicalinventory',
        module: 'warehouses',
        submodule: 'physical inventory',
      },
      {
        key: 'warehouses_products',
        module: 'warehouses',
        submodule: 'products',
      },
      { key: 'warehouses_tests', module: 'warehouses', submodule: 'tests' },
      { key: 'warehouses_kits', module: 'warehouses', submodule: 'kits' },
      {
        key: 'warehouses_fixedassets',
        module: 'warehouses',
        submodule: 'fixed assets',
      },
      {
        key: 'warehouses_transactions',
        module: 'warehouses',
        submodule: 'transactions',
      },
      {
        key: 'warehouses_transferdocuments',
        module: 'warehouses',
        submodule: 'transfer documents',
      },
      {
        key: 'warehouses_remitorders',
        module: 'warehouses',
        submodule: 'remit orders',
      },
      {
        key: 'warehouses_requestorders',
        module: 'warehouses',
        submodule: 'request orders',
      },
      {
        key: 'warehouses_businessunits',
        module: 'warehouses',
        submodule: 'business units',
      },
      {
        key: 'warehouses_medicalunitdocuments',
        module: 'warehouses',
        submodule: 'medical unit documents',
      },
      {
        key: 'warehouses_specialties',
        module: 'warehouses',
        submodule: 'specialties',
      },
      {
        key: 'warehouses_inventorydocuments',
        module: 'warehouses',
        submodule: 'inventory documents',
      },
      {
        key: 'warehouses_inventory',
        module: 'warehouses',
        submodule: 'inventory',
      },
      {
        key: 'warehouses_quarantine',
        module: 'warehouses',
        submodule: 'quarantine',
      },
      {
        key: 'warehouses_receptionorders',
        module: 'warehouses',
        submodule: 'reception orders',
      },

      // Catálogos
      { key: 'catalog_services', module: 'services', submodule: '' },
      { key: 'catalog_pruebas', module: 'pruebas', submodule: '' },

      {
        key: 'logistics_fullaccess',
        module: 'logistics',
        submodule: 'Full access',
      },
      {
        key: 'logistics_fulfillmentlists',
        module: 'logistics',
        submodule: 'Fulfillment lists',
      },
      {
        key: 'logistics_deliveryconfirmation',
        module: 'logistics',
        submodule: 'Delivery confirmation',
      },
      { key: 'logistics_shipping', module: 'logistics', submodule: 'Shipping' },

      {
        key: 'human_resources_fullaccess',
        module: 'human_resources',
        submodule: 'full access',
      },
      {
        key: 'human_resources_areas',
        module: 'human_resources',
        submodule: 'areas',
      },
      {
        key: 'human_resources_departments',
        module: 'human_resources',
        submodule: 'departments',
      },
      {
        key: 'human_resources_incidents',
        module: 'human_resources',
        submodule: 'incidents',
      },
      {
        key: 'human_resources_payroll',
        module: 'human_resources',
        submodule: 'payroll',
      },
      {
        key: 'human_resources_jobpositions',
        module: 'human_resources',
        submodule: 'job positions',
      },
      {
        key: 'human_resources_contracts',
        module: 'human_resources',
        submodule: 'contracts',
      },
      {
        key: 'human_resources_vacations',
        module: 'human_resources',
        submodule: 'vacations',
      },
      {
        key: 'human_resources_leaves',
        module: 'human_resources',
        submodule: 'leaves',
      },
      {
        key: 'human_resources_attendance',
        module: 'human_resources',
        submodule: 'attendance',
      },
      {
        key: 'human_resources_disabilities',
        module: 'human_resources',
        submodule: 'disabilities',
      },
      {
        key: 'human_resources_loans',
        module: 'human_resources',
        submodule: 'loans',
      },

      {
        key: 'calendar_PhysicalInventory',
        module: 'calendar',
        submodule: 'Physical Inventory',
      },
      {
        key: 'calendar_maintenance',
        module: 'calendar',
        submodule: 'maintenance',
      },
      {
        key: 'calendar_productreception',
        module: 'calendar',
        submodule: 'product reception',
      },
      {
        key: 'calendar_serviceplanning',
        module: 'calendar',
        submodule: 'service planning',
      },

      { key: 'parameters_owner', module: 'parameters', submodule: 'owner' },
      {
        key: 'parameters_barcodes',
        module: 'parameters',
        submodule: 'barcodes',
      },
      // Para usuarios, verificamos directamente el módulo 'users' ya que los permisos vienen como 'users.action'
      { key: 'parameters_users', module: 'users', submodule: '' },
      // Para roles, verificamos directamente el módulo 'roles' ya que los permisos vienen como 'roles.action'
      { key: 'parameters_roles', module: 'roles', submodule: '' },
      // Para permisos, verificamos directamente el módulo 'permissions' ya que los permisos vienen como 'permissions.action'
      { key: 'parameters_permissions', module: 'permissions', submodule: '' },
      {
        key: 'parameters_support',
        module: 'parameters',
        submodule: 'support tickets',
      },
      {
        key: 'parameters_tickets',
        module: 'parameters',
        submodule: 'ticket followup',
      },
      {
        key: 'parameters_control',
        module: 'parameters',
        submodule: 'version control',
      },
      // Para impuestos, verificamos directamente el módulo 'tax-rules' ya que los permisos vienen como 'tax-rules.action'
      { key: 'parameters_taxes', module: 'tax-rules', submodule: '' },
    ];

    submodules.forEach((item) => {
      (this as any)[item.key] = this.sharedService.hasAnyPermissionInSubmodule(
        item.module,
        item.submodule
      );
    });
  }

  // Método para establecer la sección activa
  setActiveSection(section: string): void {
    this.sharedService.clearActiveTab();
    this.activeSection = section;
    localStorage.setItem('activeSection', section);
  }

  // Toggle dropdown para móvil
  toggleDropdown(dropdown: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.openDropdown === dropdown) {
      this.openDropdown = null;
    } else {
      this.openDropdown = dropdown;
    }
  }

  // Verificar si dropdown está abierto
  isDropdownOpen(dropdown: string): boolean {
    return this.openDropdown === dropdown;
  }

  // Método para establecer la subsección activa
  setActiveSubSection(section: string, subSection: string): void {
    this.sharedService.clearActiveTab(); // Llamar a la función desde el servicio
    this.activeSection = section;
    this.activeSubSection = subSection;
    // Guardar la sección y subsección activa en el almacenamiento local
    localStorage.setItem('activeSection', section);
    localStorage.setItem('activeSubSection', subSection);
  }

  router = inject(Router);

  logout(): void {
    const token = localStorage.getItem('authToken');

    if (!token) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se encontró una sesión activa.',
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }

    Swal.fire({
      title: '¿Estás seguro de que deseas cerrar sesión?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        // El interceptor agregará el token automáticamente en el header Authorization
        this.http.post(apiEndpoint('auth/logout'), {}).subscribe({
          next: () => {
            localStorage.clear();

            this.sharedService.resetPermissions();
            this.router.navigate(['/login']);

            Swal.fire({
              icon: 'success',
              title: 'Sesión cerrada',
              text: 'Has cerrado sesión exitosamente.',
              timer: 1500,
              showConfirmButton: false,
            });
          },
          error: (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: error.message || 'Error al cerrar sesión',
              timer: 1500,
              showConfirmButton: false,
            });
          },
        });
      }
    });
  }
}
