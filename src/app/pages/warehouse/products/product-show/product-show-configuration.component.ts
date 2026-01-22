import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../products';

@Component({
  selector: 'app-product-show-configuration',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-show-configuration.component.html',
})
export class ProductShowConfigurationComponent {
  @Input() product: Product | null = null;
}
