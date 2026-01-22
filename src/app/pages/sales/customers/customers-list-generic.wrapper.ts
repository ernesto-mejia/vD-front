import { Component } from '@angular/core';
import { GenericListComponent } from '../../companies/generic-list/generic-list.component';
import { CUSTOMER_CONFIG } from '../../companies/generic-entity.config';
import { CustomerService } from './customer.service';

/**
 * Wrapper para el componente genérico de listado de clientes
 *
 * Este componente encapsula la configuración específica de clientes
 * permitiendo usar el componente genérico de manera transparente.
 */
@Component({
  selector: 'app-customers-list-generic',
  standalone: true,
  imports: [GenericListComponent],
  template: `<app-generic-list [config]="config"></app-generic-list>`
})
export class CustomersListGenericComponent {
  config: any;

  constructor(private customerService: CustomerService) {
    // Crear una copia de la configuración para evitar mutaciones
    this.config = { ...CUSTOMER_CONFIG, serviceClass: this.customerService };
  }
}
