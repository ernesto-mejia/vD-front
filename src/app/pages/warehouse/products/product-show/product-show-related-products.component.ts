import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-show-related-products',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-show-related-products.component.html',
})
export class ProductShowRelatedProductsComponent {
  @Input() product: any = null;
}
