import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-show-equivalencias',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-show-equivalencias.component.html',
})
export class ProductShowEquivalenciasComponent {
  @Input() product: any = null;
}
