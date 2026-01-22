import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import Swal from 'sweetalert2';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import { ProductShowGeneralComponent } from './product-show-general.component';
import { ProductShowProvidersComponent } from './product-show-providers.component';
import { ProductShowConfigurationComponent } from './product-show-configuration.component';
import { ProductShowDimensionsComponent } from './product-show-dimensions.component';
import { ProductShowEquipmentsComponent } from './product-show-equipments.component';
import { ProductShowRemplazosComponent } from './product-show-remplazos.component';
import { ProductShowEquivalenciasComponent } from './product-show-equivalencias.component';
import { ProductShowRelatedProductsComponent } from './product-show-related-products.component';
import { apiEndpoint } from '../../../../shared/api-endpoint.util';

@Component({
  selector: 'app-product-show',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    ProductShowGeneralComponent,
    ProductShowProvidersComponent,
    ProductShowConfigurationComponent,
    ProductShowDimensionsComponent,
    ProductShowEquipmentsComponent,
    ProductShowRemplazosComponent,
    ProductShowEquivalenciasComponent,
    ProductShowRelatedProductsComponent,
  ],
  templateUrl: './product-show.component.html',
  styleUrl: './product-show.component.css',
})
export class ProductShowComponent implements OnInit {
  itemId!: number;
  product: any = {};
  providersCatalog: any[] = [];
  selectedProviderId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.itemId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadItem();
    this.loadProvidersCatalog();
  }

  private loadItem(): void {
    Swal.fire({
      title: 'Cargando producto...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    this.http.get<any>(apiEndpoint(`v2/items/${this.itemId}`)).subscribe({
      next: (resp) => {
        Swal.close();
        const data = resp?.data || resp;
        this.product = {
          ...data,
          remplazos: data?.remplazos || data?.replacements || [],
          equivalencias: data?.equivalencias || data?.equivalents || [],
          related_products: data?.related_products || [],
        };
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error al cargar el producto:', error);
        Swal.close();
        Swal.fire(
          'Error',
          'No se pudo cargar la información del producto.',
          'error'
        ).then(() => {
          this.router.navigate(['/products/list']);
        });
      },
    });
  }

  private loadProvidersCatalog(): void {
    this.http.get<any>(apiEndpoint('v2/company/providers')).subscribe({
      next: (resp) => {
        this.providersCatalog = resp?.data || resp || [];
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error al cargar catálogo de proveedores:', error);
      },
    });
  }

  startAddProvider(): void {
    if (!this.providersCatalog.length) {
      Swal.fire(
        'Información',
        'No hay proveedores disponibles para relacionar.',
        'info'
      );
      return;
    }

    this.selectedProviderId = null;

    Swal.fire({
      title: 'Agregar proveedor',
      html: this.buildAddProviderHtml(),
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      didOpen: () => {
        const select = document.getElementById(
          'provider-select'
        ) as HTMLSelectElement | null;
        const codeInput = document.getElementById(
          'provider-code'
        ) as HTMLInputElement | null;
        if (select) {
          this.providersCatalog.forEach((prov: any) => {
            const option = document.createElement('option');
            option.value = String(prov.id);
            option.text = prov.name || prov.shortname || prov.company;
            select.add(option);
          });
        }
        if (codeInput) {
          codeInput.focus();
        }
      },
      preConfirm: () => {
        const select = document.getElementById(
          'provider-select'
        ) as HTMLSelectElement | null;
        const codeInput = document.getElementById(
          'provider-code'
        ) as HTMLInputElement | null;

        if (!select || !select.value) {
          Swal.showValidationMessage('Seleccione un proveedor');
          return false;
        }

        if (!codeInput || !codeInput.value.trim()) {
          Swal.showValidationMessage('El código de proveedor es obligatorio');
          return false;
        }

        return {
          provider_id: Number(select.value),
          provider_code: codeInput.value.trim(),
        };
      },
    }).then((result) => {
      if (result.isConfirmed && result.value?.provider_id) {
        this.doAddProvider(
          result.value.provider_id,
          result.value.provider_code
        );
      }
    });
  }

  goToEdit(): void {
    this.router.navigate(['/products/edit', this.itemId]);
  }

  private buildAddProviderHtml(): string {
    return `
      <div class="mb-3 text-start">
        <label for="provider-select" class="form-label">Proveedor</label>
        <select id="provider-select" class="form-select">
          <option value="">Seleccione un proveedor</option>
        </select>
        <small class="form-text text-muted">Campo obligatorio.</small>
      </div>
      <div class="mb-3 text-start">
        <label for="provider-code" class="form-label">Código proveedor</label>
        <input id="provider-code" type="text" class="form-control" />
        <small class="form-text text-muted">Campo obligatorio.</small>
      </div>
    `;
  }

  private doAddProvider(providerId: number, providerCode: string): void {
    const payload = {
      provider_id: providerId,
      provider_code: providerCode,
      provider_sku: null,
      is_active: true,
      is_primary: false,
      valid_from: null,
      valid_until: null,
      meta: {
        notes: '',
      },
    };

    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    const token = localStorage.getItem('authToken');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    Swal.fire({
      title: 'Agregando proveedor...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    this.http
      .post(apiEndpoint(`v2/items/${this.itemId}/providers`), payload, {
        headers,
      })
      .subscribe({
        next: () => {
          Swal.close();
          Swal.fire('Éxito', 'Proveedor agregado al producto.', 'success');
          this.loadItem();
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error al agregar proveedor:', error);
          Swal.close();

          let message = 'No se pudo agregar el proveedor. Intente nuevamente.';

          if (
            error.status === 422 &&
            (error.error?.errors || error.error?.message)
          ) {
            if (error.error.errors) {
              const list = Object.values(error.error.errors as any)
                .flat()
                .map((e: any) => `<li>${e}</li>`)
                .join('');
              message = `<ul>${list}</ul>`;
            } else if (error.error.message) {
              message = error.error.message;
            }
          }

          Swal.fire({
            icon: 'error',
            title: 'Error',
            html: message,
          });
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/products/list']);
  }
}
