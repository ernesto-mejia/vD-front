import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-show-providers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-show-providers.component.html',
})
export class ProductShowProvidersComponent {
  @Input() product: any = null;
  @Input() providersCatalog: any[] = [];
  @Output() addProviderRequested = new EventEmitter<void>();

  requestAddProvider(): void {
    this.addProviderRequested.emit();
  }
}
