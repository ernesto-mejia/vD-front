/**
 * Configuración genérica para componentes reutilizables de entidades (Providers, Customers, etc.)
 * Esta interfaz define cómo se comportará cada componente genérico según el tipo de entidad
 */

export interface GenericEntityConfig {
  // Identificador único de la entidad
  entityType: 'provider' | 'customer';

  // Rutas de navegación
  listRoute: string;
  showRoute: string;
  addRoute: string;
  editRoute: string;

  // Títulos y etiquetas
  singularName: string;
  pluralName: string;
  addTitle: string;
  editTitle: string;
  showTitle: string;
  listTitle: string;

  // Endpoints de API
  apiListEndpoint: string;
  apiCreateEndpoint: string;
  apiGetEndpoint: string; // Usa {id} como placeholder
  apiUpdateEndpoint: string; // Usa {id} como placeholder
  apiDeleteEndpoint: string; // Usa {id} como placeholder

  // Configuración de formularios
  wizardSteps?: WizardStepConfig[];
  companyTypeDefaultValue?: string;
  companyScopeDefaultValue?: string;

  // Configuración de columnas de tabla
  listColumns?: ListColumnConfig[];

  // Configuración de pestañas
  tabsConfig?: TabConfig[];

  // Servicios personalizados
  serviceClass: any; // Service class para la entidad
}

export interface WizardStepConfig {
  step: number;
  title: string;
  fields: FormFieldConfig[];
}

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'select' | 'textarea' | 'number';
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  options?: Array<{ label: string; value: any }>;
  validation?: (value: any) => boolean | string;
}

export interface ListColumnConfig {
  title: string;
  data: string;
  render?: (data: any, type: string, row: any) => string;
}

export interface TabConfig {
  id: string;
  label: string;
  icon?: string;
  component?: any; // Componente personalizado para la pestaña
}

/**
 * Configuración predefinida para Providers
 */
export const PROVIDER_CONFIG: GenericEntityConfig = {
  entityType: 'provider',
  listRoute: '/providers/list',
  showRoute: '/providers/show',
  addRoute: '/providers/add',
  editRoute: '/providers/edit',
  singularName: 'Proveedor',
  pluralName: 'Proveedores',
  addTitle: 'Nuevo Proveedor',
  editTitle: 'Editar Proveedor',
  showTitle: 'Detalles del Proveedor',
  listTitle: 'Lista de Proveedores',
  apiListEndpoint: 'company/providers',
  apiCreateEndpoint: 'company/providers',
  apiGetEndpoint: 'company/providers/{id}',
  apiUpdateEndpoint: 'company/providers/{id}',
  apiDeleteEndpoint: 'company/providers/{id}',
  companyTypeDefaultValue: 'proveedor',
  companyScopeDefaultValue: 'servicios',
  serviceClass: null, // Se asigna en tiempo de ejecución
};

/**
 * Configuración predefinida para Customers
 */
export const CUSTOMER_CONFIG: GenericEntityConfig = {
  entityType: 'customer',
  listRoute: '/customers/list',
  showRoute: '/customersv2/customer-show',
  addRoute: '/customers/add',
  editRoute: '/customers/edit',
  singularName: 'Cliente',
  pluralName: 'Clientes',
  addTitle: 'Nuevo Cliente',
  editTitle: 'Editar Cliente',
  showTitle: 'Detalles del Cliente',
  listTitle: 'Lista de Clientes',
  apiListEndpoint: 'v2/company/clients',
  apiCreateEndpoint: 'v2/company/clients',
  apiGetEndpoint: 'v2/company/clients/{id}',
  apiUpdateEndpoint: 'v2/company/clients/{id}',
  apiDeleteEndpoint: 'v2/company/clients/{id}',
  companyTypeDefaultValue: 'cliente',
  companyScopeDefaultValue: 'servicios',
  tabsConfig: [
    { id: 'info', label: 'Información General', icon: 'fas fa-info-circle' },
    { id: 'contacts', label: 'Contactos', icon: 'fas fa-users' },
    { id: 'addresses', label: 'Direcciones', icon: 'fas fa-map-marker-alt' },
    { id: 'taxData', label: 'Datos Fiscales', icon: 'fas fa-receipt' },
    // Puedes agregar más pestañas si es necesario
  ],
  serviceClass: null, // Se asigna en tiempo de ejecución
};
