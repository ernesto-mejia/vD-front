import { Injectable } from '@angular/core';
import { SharedService } from '../../../servicios/shared.service';

@Injectable({
  providedIn: 'root'
})
export class CustomerPermissionService {

  constructor(private sharedService: SharedService) {}

  // Permisos principales de clientes
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

  // Permisos de direcciones de clientes
  canViewCustomerAddresses(): boolean {
    return this.sharedService.hasPermission('clients', 'addresses', 'view');
  }

  canCreateCustomerAddresses(): boolean {
    return this.sharedService.hasPermission('clients', 'addresses', 'create');
  }

  canEditCustomerAddresses(): boolean {
    return this.sharedService.hasPermission('clients', 'addresses', 'edit');
  }

  canDeleteCustomerAddresses(): boolean {
    return this.sharedService.hasPermission('clients', 'addresses', 'delete');
  }

  // Permisos de contactos de clientes
  canViewCustomerContacts(): boolean {
    return this.sharedService.hasPermission('clients', 'contacts', 'view');
  }

  canCreateCustomerContacts(): boolean {
    return this.sharedService.hasPermission('clients', 'contacts', 'create');
  }

  canEditCustomerContacts(): boolean {
    return this.sharedService.hasPermission('clients', 'contacts', 'edit');
  }

  canDeleteCustomerContacts(): boolean {
    return this.sharedService.hasPermission('clients', 'contacts', 'delete');
  }

  // Permisos de documentos de clientes
  canViewCustomerDocuments(): boolean {
    return this.sharedService.hasPermission('clients', 'documents', 'view');
  }

  // Métodos auxiliares
  hasAnyCustomerPermission(): boolean {
    return this.sharedService.hasAnyPermissionInModule('clients');
  }

  hasAnyAddressPermission(): boolean {
    return this.canViewCustomerAddresses() || this.canCreateCustomerAddresses() ||
           this.canEditCustomerAddresses() || this.canDeleteCustomerAddresses();
  }

  hasAnyContactPermission(): boolean {
    return this.canViewCustomerContacts() || this.canCreateCustomerContacts() ||
           this.canEditCustomerContacts() || this.canDeleteCustomerContacts();
  }

  // Método para verificar múltiples permisos a la vez
  hasCustomerPermissions(permissions: string[]): boolean {
    return permissions.every(permission => {
      switch (permission) {
        case 'view':
          return this.canViewCustomers();
        case 'create':
          return this.canCreateCustomers();
        case 'edit':
          return this.canEditCustomers();
        case 'delete':
          return this.canDeleteCustomers();
        case 'addresses.view':
          return this.canViewCustomerAddresses();
        case 'addresses.create':
          return this.canCreateCustomerAddresses();
        case 'addresses.edit':
          return this.canEditCustomerAddresses();
        case 'addresses.delete':
          return this.canDeleteCustomerAddresses();
        case 'contacts.view':
          return this.canViewCustomerContacts();
        case 'contacts.create':
          return this.canCreateCustomerContacts();
        case 'contacts.edit':
          return this.canEditCustomerContacts();
        case 'contacts.delete':
          return this.canDeleteCustomerContacts();
        case 'documents.view':
          return this.canViewCustomerDocuments();
        default:
          return false;
      }
    });
  }

  // Método para obtener los permisos que el usuario actual tiene
  getCustomerPermissions(): string[] {
    const permissions: string[] = [];

    if (this.canViewCustomers()) permissions.push('view');
    if (this.canCreateCustomers()) permissions.push('create');
    if (this.canEditCustomers()) permissions.push('edit');
    if (this.canDeleteCustomers()) permissions.push('delete');
    if (this.canViewCustomerAddresses()) permissions.push('addresses.view');
    if (this.canCreateCustomerAddresses()) permissions.push('addresses.create');
    if (this.canEditCustomerAddresses()) permissions.push('addresses.edit');
    if (this.canDeleteCustomerAddresses()) permissions.push('addresses.delete');
    if (this.canViewCustomerContacts()) permissions.push('contacts.view');
    if (this.canCreateCustomerContacts()) permissions.push('contacts.create');
    if (this.canEditCustomerContacts()) permissions.push('contacts.edit');
    if (this.canDeleteCustomerContacts()) permissions.push('contacts.delete');
    if (this.canViewCustomerDocuments()) permissions.push('documents.view');

    return permissions;
  }
}
