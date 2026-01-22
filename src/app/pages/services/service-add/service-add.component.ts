import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { ServiceService } from '../service.service';
import { ProviderOption, ServiceCreateRequest } from '../services';

@Component({
  selector: 'app-service-add',
  templateUrl: './service-add.component.html',
  styleUrls: ['./service-add.component.css'],
})
export class ServiceAddComponent implements OnInit, OnDestroy {
  submitted = false;
  loading = false;

  // Modelo del servicio
  service: ServiceCreateRequest = {
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
    private location: Location
  ) {}

  ngOnInit(): void {
    this.loadMetaData();
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

  providerSearchFn(term: string, item: ProviderOption): boolean {
    term = term.toLowerCase();
    return item.name?.toLowerCase().includes(term) || false;
  }

  goBack(): void {
    this.location.back();
  }

  saveService(): void {
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
      .createService(this.service)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          Swal.fire({
            icon: 'success',
            title: 'Servicio creado',
            text: 'El servicio ha sido creado exitosamente.',
            showCancelButton: true,
            confirmButtonText: 'Ver detalle',
            cancelButtonText: 'Regresar a lista',
            reverseButtons: true,
          }).then((result) => {
            if (result.isConfirmed && response?.id) {
              this.router.navigate(['/services/show', response.id]);
              return;
            }
            this.router.navigate(['/services/list']);
          });
        },
        error: (error) => {
          this.loading = false;
          console.error('Error al crear servicio:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Ocurrió un error al crear el servicio.',
          });
        },
      });
  }
}
