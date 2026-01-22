import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-show-equipments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-show-equipments.component.html',
})
export class ProductShowEquipmentsComponent {
  @Input() product: any = null;
}
