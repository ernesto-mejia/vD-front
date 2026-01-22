import { Component } from '@angular/core';
import { GenericAddComponent } from '../../companies/generic-add/generic-add.component';
import { CUSTOMER_CONFIG } from '../../companies/generic-entity.config';
import { CustomerService } from './customer.service';

/**
 * Wrapper para el componente genérico de agregar clientes
 */
@Component({
  selector: 'app-customer-add-generic',
  standalone: true,
  imports: [GenericAddComponent],
  template: `<app-generic-add [config]="config"></app-generic-add>`
})
export class CustomerAddGenericComponent {
  config: any;

  constructor(private customerService: CustomerService) {
    // Crear una copia de la configuración para evitar mutaciones
    this.config = { ...CUSTOMER_CONFIG, serviceClass: this.customerService };
  }
}
