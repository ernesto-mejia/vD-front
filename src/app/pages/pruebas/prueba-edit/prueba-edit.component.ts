import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { PruebaService } from '../prueba.service';
import {
  ClientOption,
  MedicalTestOption,
  PruebaUpdateRequest,
  SpecialtyOption,
  TaxRuleOption,
} from '../pruebas';

@Component({
  selector: 'app-prueba-edit',
  templateUrl: './prueba-edit.component.html',
  styleUrls: ['./prueba-edit.component.css'],
})
export class PruebaEditComponent implements OnInit, OnDestroy {
  submitted = false;
  loading = false;
  pruebaId: number = 0;

  // Modelo de la prueba
  prueba: PruebaUpdateRequest = {
    code: '',
    name: '',
    group_name: '',
    sat_code: '',
    unit: '',
    client_id: undefined,
    specialty_id: undefined,
    has_tax_code: false,
    tax_rule_id: null,
    is_billable: false,
    is_purchasable: false,
  };

  // Opciones para selectores
  clientsCatalog: ClientOption[] = [];
  specialties: SpecialtyOption[] = [];
  taxRules: TaxRuleOption[] = [];

  // Estados de carga
  loadingClients = false;
  loadingSpecialties = false;
  loadingTaxRules = false;

  groupNameInput = '';
  groupNameOptions: Array<{ id: number; label: string; group_name?: string | null }> = [];
  private groupNameSearchTimeout: any = null;

  private destroy$ = new Subject<void>();

  constructor(
    private pruebaService: PruebaService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.pruebaId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadMetaData();
    this.loadPrueba();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadMetaData(): void {
    // Cargar clientes
    this.loadingClients = true;
    this.pruebaService
      .getClientsCatalog()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (clients) => {
          this.clientsCatalog = clients || [];
          this.loadingClients = false;
        },
        error: (error) => {
          console.error('Error al cargar clientes:', error);
          this.loadingClients = false;
        },
      });

    // Cargar especialidades
    this.loadingSpecialties = true;
    this.pruebaService
      .getSpecialties()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (specialties) => {
          this.specialties = specialties || [];
          this.loadingSpecialties = false;
        },
        error: (error) => {
          console.error('Error al cargar especialidades:', error);
          this.loadingSpecialties = false;
        },
      });

    // Cargar reglas de impuestos
    this.loadingTaxRules = true;
    this.pruebaService
      .getTaxRules()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rules) => {
          this.taxRules = rules || [];
          this.loadingTaxRules = false;
        },
        error: (error) => {
          console.error('Error al cargar reglas de impuesto:', error);
          this.loadingTaxRules = false;
        },
      });
  }

  private loadPrueba(): void {
    this.loading = true;

    Swal.fire({
      title: 'Cargando...',
      text: 'Por favor espera mientras se cargan los datos.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(null),
    });

    this.pruebaService
      .getPrueba(this.pruebaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          Swal.close();

          if (response) {
            this.prueba = {
              code: response.code,
              name: response.name,
              group_name: response.group_name,
              sat_code: response.sat_code,
              unit: response.unit,
              client_id: response.client_id,
              specialty_id: response.specialty_id,
              has_tax_code: response.has_tax_code,
              tax_rule_id: response.tax_rule_id ?? null,
              is_billable: response.is_billable,
              is_purchasable: response.is_purchasable,
            };
            this.groupNameInput = response.group_name || '';
            if (response.group_name) {
              this.groupNameOptions = [
                {
                  id: response.id,
                  label: response.group_name,
                  group_name: response.group_name,
                },
                ...this.groupNameOptions,
              ];
            }
          }
        },
        error: (error) => {
          this.loading = false;
          Swal.close();
          console.error('Error al cargar estudio:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar la información del estudio.',
          });
        },
      });
  }

  customerSearchFn(term: string, item: ClientOption): boolean {
    term = term.toLowerCase();
    return (
      item.name?.toLowerCase().includes(term) ||
      item.tax_id?.toLowerCase().includes(term) ||
      item.shortname?.toLowerCase().includes(term) ||
      false
    );
  }

  getFilteredGroupNameOptions(): Array<{ id: number; label: string; group_name?: string | null }> {
    const value = this.groupNameInput.trim().toLowerCase();
    if (!value) {
      return this.groupNameOptions;
    }

    return this.groupNameOptions.filter((option) =>
      option.label.toLowerCase().includes(value)
    );
  }

  searchGroupNames(): void {
    const value = this.groupNameInput.trim();
    if (this.groupNameSearchTimeout) {
      clearTimeout(this.groupNameSearchTimeout);
    }

    this.groupNameSearchTimeout = setTimeout(() => {
      if (!value) {
        this.groupNameOptions = [];
        return;
      }
      this.pruebaService
        .getMedicalTestOptions(value)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (items: MedicalTestOption[]) => {
            this.groupNameOptions = (items || []).map((item) => ({
              id: item.id,
              label: (item.group_name || item.name || String(item.id)).trim(),
              group_name: item.group_name,
            }));
          },
          error: (error) => console.error('Error al buscar grupos:', error),
        });
    }, 250);
  }

  addGroupNameOption(): void {
    const value = this.groupNameInput.trim();
    if (!value) {
      return;
    }

    const uppercaseValue = value.toUpperCase();
    const payload = {
      name: this.prueba.name?.trim() || uppercaseValue,
      group_name: uppercaseValue,
    };

    this.pruebaService
      .quickCreateMedicalTest(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          const label = resp?.group_name || uppercaseValue;
          const option = {
            id: resp?.id ?? 0,
            label,
            group_name: resp?.group_name ?? uppercaseValue,
          };
          if (option.id) {
            this.groupNameOptions = [
              option,
              ...this.groupNameOptions.filter((opt) => opt.id !== option.id),
            ];
          }
          this.selectGroupNameOption(option);
        },
        error: (error) => console.error('Error al crear grupo:', error),
      });
  }

  selectGroupNameOption(option: { id: number; label: string; group_name?: string | null }): void {
    this.groupNameInput = option.label;
    this.prueba.group_name = option.group_name ?? option.label;
  }

  syncGroupNameOption(): void {
    const value = this.groupNameInput.trim();
    this.prueba.group_name = value || undefined;
  }

  onHasTaxCodeChange(): void {
    if (!this.prueba.has_tax_code) {
      this.prueba.tax_rule_id = null;
    }
  }

  goBack(): void {
    this.location.back();
  }

  updatePrueba(): void {
    this.submitted = true;

    // Validar campos requeridos
    if (!this.prueba.code || !this.prueba.name) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'Por favor complete los campos obligatorios.',
      });
      return;
    }

    this.loading = true;

    this.pruebaService
      .updatePrueba(this.pruebaId, this.prueba)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          Swal.fire({
            icon: 'success',
            title: 'Estudio actualizado',
            text: 'El estudio ha sido actualizado exitosamente.',
            timer: 2000,
            showConfirmButton: false,
          }).then(() => {
            this.router.navigate(['/pruebas/list']);
          });
        },
        error: (error) => {
          this.loading = false;
          console.error('Error al actualizar estudio:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Ocurrió un error al actualizar el estudio.',
          });
        },
      });
  }
}
