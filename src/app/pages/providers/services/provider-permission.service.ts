import { Injectable } from '@angular/core';
import { SharedService } from '../../../servicios/shared.service';

@Injectable({
  providedIn: 'root'
})
export class ProviderPermissionService {

  constructor(private sharedService: SharedService) {}

  // Permisos principales de proveedores
  canViewProviders(): boolean {
    return this.sharedService.hasPermission('providers', '', 'view');
  }

  canCreateProviders(): boolean {
    return this.sharedService.hasPermission('providers', '', 'create');
  }

  canEditProviders(): boolean {
    return this.sharedService.hasPermission('providers', '', 'edit');
  }

  canDeleteProviders(): boolean {
    return this.sharedService.hasPermission('providers', '', 'delete');
  }

  // Permisos de direcciones de proveedores
  canViewProviderAddresses(): boolean {
    return this.sharedService.hasPermission('providers', 'addresses', 'view');
  }

  canCreateProviderAddresses(): boolean {
    return this.sharedService.hasPermission('providers', 'addresses', 'create');
  }

  canEditProviderAddresses(): boolean {
    return this.sharedService.hasPermission('providers', 'addresses', 'edit');
  }

  canDeleteProviderAddresses(): boolean {
    return this.sharedService.hasPermission('providers', 'addresses', 'delete');
  }

  // Permisos de contactos de proveedores
  canViewProviderContacts(): boolean {
    return this.sharedService.hasPermission('providers', 'contacts', 'view');
  }

  canCreateProviderContacts(): boolean {
    return this.sharedService.hasPermission('providers', 'contacts', 'create');
  }

  canEditProviderContacts(): boolean {
    return this.sharedService.hasPermission('providers', 'contacts', 'edit');
  }

  canDeleteProviderContacts(): boolean {
    return this.sharedService.hasPermission('providers', 'contacts', 'delete');
  }

  // Permisos de documentos de proveedores
  canViewProviderDocuments(): boolean {
    return this.sharedService.hasPermission('providers', 'documents', 'view');
  }

  // Métodos auxiliares
  hasAnyProviderPermission(): boolean {
    return this.sharedService.hasAnyPermissionInModule('providers');
  }

  hasAnyAddressPermission(): boolean {
    return this.canViewProviderAddresses() || this.canCreateProviderAddresses() ||
           this.canEditProviderAddresses() || this.canDeleteProviderAddresses();
  }

  hasAnyContactPermission(): boolean {
    return this.canViewProviderContacts() || this.canCreateProviderContacts() ||
           this.canEditProviderContacts() || this.canDeleteProviderContacts();
  }

  // Método para verificar múltiples permisos a la vez
  hasProviderPermissions(permissions: string[]): boolean {
    return permissions.every(permission => {
      switch (permission) {
        case 'view':
          return this.canViewProviders();
        case 'create':
          return this.canCreateProviders();
        case 'edit':
          return this.canEditProviders();
        case 'delete':
          return this.canDeleteProviders();
        case 'addresses.view':
          return this.canViewProviderAddresses();
        case 'addresses.create':
          return this.canCreateProviderAddresses();
        case 'addresses.edit':
          return this.canEditProviderAddresses();
        case 'addresses.delete':
          return this.canDeleteProviderAddresses();
        case 'contacts.view':
          return this.canViewProviderContacts();
        case 'contacts.create':
          return this.canCreateProviderContacts();
        case 'contacts.edit':
          return this.canEditProviderContacts();
        case 'contacts.delete':
          return this.canDeleteProviderContacts();
        case 'documents.view':
          return this.canViewProviderDocuments();
        default:
          return false;
      }
    });
  }

  // Método para obtener los permisos que el usuario actual tiene
  getProviderPermissions(): string[] {
    const permissions: string[] = [];

    if (this.canViewProviders()) permissions.push('view');
    if (this.canCreateProviders()) permissions.push('create');
    if (this.canEditProviders()) permissions.push('edit');
    if (this.canDeleteProviders()) permissions.push('delete');
    if (this.canViewProviderAddresses()) permissions.push('addresses.view');
    if (this.canCreateProviderAddresses()) permissions.push('addresses.create');
    if (this.canEditProviderAddresses()) permissions.push('addresses.edit');
    if (this.canDeleteProviderAddresses()) permissions.push('addresses.delete');
    if (this.canViewProviderContacts()) permissions.push('contacts.view');
    if (this.canCreateProviderContacts()) permissions.push('contacts.create');
    if (this.canEditProviderContacts()) permissions.push('contacts.edit');
    if (this.canDeleteProviderContacts()) permissions.push('contacts.delete');
    if (this.canViewProviderDocuments()) permissions.push('documents.view');

    return permissions;
  }
}
