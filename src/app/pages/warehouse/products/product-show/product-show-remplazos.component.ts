import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-show-remplazos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-show-remplazos.component.html',
})
export class ProductShowRemplazosComponent {
  @Input() product: any = null;

  getRemplazoProviderName(rem: any): string {
    if (!rem) {
      return '-';
    }
    if (rem.provider_name) {
      return rem.provider_name;
    }
    const provider =
      rem.provider ||
      rem.providers?.find((p: any) => p.is_primary) ||
      rem.providers?.[0] ||
      null;
    return provider?.shortname || provider?.name || provider?.company || '-';
  }

  getRemplazoProviderCode(rem: any): string {
    if (!rem) {
      return '-';
    }
    if (rem.provider_code) {
      return rem.provider_code;
    }
    const provider =
      rem.provider ||
      rem.providers?.find((p: any) => p.is_primary) ||
      rem.providers?.[0] ||
      null;
    return provider?.provider_code || '-';
  }
}
