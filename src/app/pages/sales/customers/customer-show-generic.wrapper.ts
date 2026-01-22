import { Component } from '@angular/core';
import { GenericShowComponent } from '../../companies/generic-show/generic-show.component';
import { CUSTOMER_CONFIG } from '../../companies/generic-entity.config';
import { CustomerService } from './customer.service';

/**
 * Wrapper para el componente genérico de vista de clientes
 */
@Component({
  selector: 'app-customer-show-generic',
  standalone: true,
  imports: [GenericShowComponent],
  template: `<app-generic-show [config]="config"></app-generic-show>`,
})
export class CustomerShowGenericComponent {
  config: any;

  constructor(private customerService: CustomerService) {
    // Crear una copia de la configuración para evitar mutaciones
    this.config = { ...CUSTOMER_CONFIG, serviceClass: this.customerService };
  }
}
