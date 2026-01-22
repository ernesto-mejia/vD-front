import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../products';

@Component({
  selector: 'app-product-show-general',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-show-general.component.html',
})
export class ProductShowGeneralComponent {
  @Input() product: Product | null = null;

  getPrimaryProvider(): any | null {
    const providers = (this.product as any)?.providers || [];
    return (
      providers.find((provider: any) => provider.is_primary) ||
      providers[0] ||
      null
    );
  }

  getPrimaryProviderLabel(): string {
    const provider = this.getPrimaryProvider();
    if (!provider) {
      return '-';
    }
    const name = provider.shortname || provider.name || provider.company || '-';
    const code = provider.provider_code || '-';
    return `${name} (# Catálogo: ${code})`;
  }

  getPrimaryProviderName(): string {
    const provider = this.getPrimaryProvider();
    return provider?.shortname || provider?.name || provider?.company || '-';
  }

  getPrimaryProviderCode(): string {
    const provider = this.getPrimaryProvider();
    return provider?.provider_code || '-';
  }

  getPrimaryProviderRef(): string {
    const provider = this.getPrimaryProvider();
    return (
      provider?.ref ||
      provider?.provider_ref ||
      provider?.reference ||
      provider?.provider_code ||
      '-'
    );
  }
}
