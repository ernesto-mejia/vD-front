import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { ServiceService } from '../service.service';
import { ProviderOption, Service, ServiceUpdateRequest } from '../services';

@Component({
  selector: 'app-service-edit',
  templateUrl: './service-edit.component.html',
  styleUrls: ['./service-edit.component.css'],
})
export class ServiceEditComponent implements OnInit, OnDestroy {
  submitted = false;
  loading = false;
  serviceId: number = 0;

  // Modelo del servicio
  service: ServiceUpdateRequest = {
    name: '',
    description: '',
    code: '',
    tax_rule_id: undefined,
    is_purchasable: false,
    is_billable: false,
    unit: '',
    sat_unit_code: 'E48',
    is_active: true,
    providers: [],
  };

  // Opciones para selectores
  taxes: any[] = [];
  units: any[] = [];
  providersCatalog: ProviderOption[] = [];
  loadingProviders = false;

  private destroy$ = new Subject<void>();

  constructor(
    private serviceService: ServiceService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.serviceId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadMetaData();
    this.loadService();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadMetaData(): void {
    this.setDefaultUnits();
    // Cargar impuestos
    this.serviceService
      .getServiceTaxes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (taxes) => {
          this.taxes = taxes || [];
        },
        error: (error) => console.error('Error al cargar impuestos:', error),
      });

    // Cargar unidades
    this.serviceService
      .getServiceUnits()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (units) => {
          this.units = units || [];
          this.addUnitOption('Servicio');
          this.addUnitOption('Actividad');
        },
        error: (error) => {
          console.error('Error al cargar unidades:', error);
          this.setDefaultUnits();
        },
      });

    this.loadProvidersCatalog();
  }

  private loadProvidersCatalog(): void {
    this.loadingProviders = true;
    this.serviceService
      .getProvidersCatalog()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (providers) => {
          this.providersCatalog = providers || [];
          this.loadingProviders = false;
        },
        error: (error) => {
          console.error('Error al cargar proveedores:', error);
          this.loadingProviders = false;
        },
      });
  }

  private addUnitOption(name: string): void {
    if (!this.units.some((unit) => unit.id === name)) {
      this.units = [...this.units, { id: name, name }];
    }
  }

  private setDefaultUnits(): void {
    this.units = [];
    this.addUnitOption('Servicio');
    this.addUnitOption('Actividad');
  }

  private loadService(): void {
    this.loading = true;

    Swal.fire({
      title: 'Cargando...',
      text: 'Por favor espera mientras se cargan los datos.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(null),
    });

    this.serviceService
      .getService(this.serviceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          Swal.close();

          if (response) {
            this.service = {
              name: response.name,
              description: response.description,
              code: response.code,
              tax_rule_id: response.tax_rule_id,
              is_purchasable: response.is_purchasable || false,
              is_billable: response.is_billable || false,
              unit: response.unit,
              sat_unit_code: response.sat_unit_code,
              is_active: response.is_active,
              providers: response.providers || [],
            };
          }
        },
        error: (error) => {
          this.loading = false;
          Swal.close();
          console.error('Error al cargar servicio:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar la información del servicio.',
          });
        },
      });
  }


  goBack(): void {
    this.location.back();
  }

  providerSearchFn(term: string, item: ProviderOption): boolean {
    term = term.toLowerCase();
    return item.name?.toLowerCase().includes(term) || false;
  }

  updateService(): void {
    this.submitted = true;

    // Validar campos requeridos
    if (!this.service.name) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'Por favor complete los campos obligatorios.',
      });
      return;
    }

    this.loading = true;

    this.serviceService
      .updateService(this.serviceId, this.service)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          Swal.fire({
            icon: 'success',
            title: 'Servicio actualizado',
            text: 'El servicio ha sido actualizado exitosamente.',
            timer: 2000,
            showConfirmButton: false,
          }).then(() => {
            this.router.navigate(['/services/list']);
          });
        },
        error: (error) => {
          this.loading = false;
          console.error('Error al actualizar servicio:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Ocurrió un error al actualizar el servicio.',
          });
        },
      });
  }
}
