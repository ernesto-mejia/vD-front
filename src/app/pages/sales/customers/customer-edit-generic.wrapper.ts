import { Component } from '@angular/core';
import { GenericEditComponent } from '../../companies/generic-edit/generic-edit.component';
import { CUSTOMER_CONFIG } from '../../companies/generic-entity.config';
import { CustomerService } from './customer.service';

/**
 * Wrapper para el componente genérico de editar clientes
 */
@Component({
  selector: 'app-customer-edit-generic',
  standalone: true,
  imports: [GenericEditComponent],
  template: `<app-generic-edit [config]="config"></app-generic-edit>`,
})
export class CustomerEditGenericComponent {
  config: any;

  constructor(private customerService: CustomerService) {
    // Crear una copia de la configuración para evitar mutaciones
    this.config = { ...CUSTOMER_CONFIG, serviceClass: this.customerService };
  }
}
