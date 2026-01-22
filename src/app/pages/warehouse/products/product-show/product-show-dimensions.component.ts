import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../products';

@Component({
  selector: 'app-product-show-dimensions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-show-dimensions.component.html',
})
export class ProductShowDimensionsComponent {
  @Input() product: Product | null = null;
}
