import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { PruebaService } from '../prueba.service';
import {
  ClientOption,
  MedicalTestOption,
  PruebaCreateRequest,
  SpecialtyOption,
  TaxRuleOption,
} from '../pruebas';

@Component({
  selector: 'app-prueba-add',
  templateUrl: './prueba-add.component.html',
  styleUrls: ['./prueba-add.component.css'],
})
export class PruebaAddComponent implements OnInit, OnDestroy {
  submitted = false;
  loading = false;

  // Modelo de la prueba
  prueba: PruebaCreateRequest = {
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

  customerSearchFn(term: string, item: ClientOption): boolean {
    term = term.toLowerCase();
    return (
      item.name?.toLowerCase().includes(term) ||
      item.tax_id?.toLowerCase().includes(term) ||
      item.shortname?.toLowerCase().includes(term) ||
      false
    );
  }

  onHasTaxCodeChange(): void {
    if (!this.prueba.has_tax_code) {
      this.prueba.tax_rule_id = null;
    }
  }

  goBack(): void {
    this.location.back();
  }

  savePrueba(): void {
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
      .createPrueba(this.prueba)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          Swal.fire({
            icon: 'success',
            title: 'Estudio creado',
            text: 'El estudio ha sido creado exitosamente.',
            showCancelButton: true,
            confirmButtonText: 'Ver detalle',
            cancelButtonText: 'Regresar a lista',
            reverseButtons: true,
          }).then((result) => {
            if (result.isConfirmed && response?.id) {
              this.router.navigate(['/pruebas/show', response.id]);
              return;
            }
            this.router.navigate(['/pruebas/list']);
          });
        },
        error: (error) => {
          this.loading = false;
          console.error('Error al crear estudio:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Ocurrió un error al crear el estudio.',
          });
        },
      });
  }
}
