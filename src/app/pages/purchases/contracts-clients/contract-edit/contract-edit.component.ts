import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { NgSelectModule } from '@ng-select/ng-select';
import Swal from 'sweetalert2';

import { SidebarComponent } from '../../../sidebar/sidebar.component';
import { ClientContractService } from '../contract.service';
import { CustomerService } from '../../../customers/customer.service';
import {
  ClientContract,
  ClientContractUpdateRequest,
  RegionSystem,
  SystemRegion,
  CustomerAddress,
  Item,
  BondingCompany,
  ContractDocument
} from '../contracts';

interface CustomerOption {
  id: number;
  shortname: string;
  company: string;
  tax_id?: string;
}

@Component({
  selector: 'app-contract-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule, SidebarComponent],
  templateUrl: './contract-edit.component.html',
  styleUrl: './contract-edit.component.css'
})
export class ContractEditComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  contractId: number = 0;
  submitted = false;
  saving = false;
  loading = true;

  // Datos del contrato
  contract: ClientContractUpdateRequest = {
    id: 0,
    customer_id: 0,
    project_name: '',
    description: '',
    region_ids: [],
    start_date: '',
    end_date: '',
    min_amount: 0,
    max_amount: 0,
    contract_number: '',
    licitation_number: '',
    address_ids: [],
    item_ids: [],
    has_bonding: false,
    bonding_company_id: undefined,
    bonding_amount: undefined,
    bonding_start_date: '',
    bonding_end_date: '',
    alert_days_before: 30,
    status_id: undefined
  };

  customerCompany = '';

  // Estados de contrato
  contractStatuses: { id: number; name: string }[] = [];

  // Opciones
  customers: CustomerOption[] = [];
  customerRegions: SystemRegion[] = [];
  customerRegionSystem: RegionSystem | null = null;
  customerAddresses: CustomerAddress[] = [];
  items: Item[] = [];
  bondingCompanies: BondingCompany[] = [];

  // Documentos del contrato
  contractDocuments: ContractDocument[] = [];
  documentTypes = [
    { id: 1, name: 'Contrato firmado' },
    { id: 2, name: 'Fianza' },
    { id: 3, name: 'Orden de compra' },
    { id: 4, name: 'Convenio de confidencialidad' },
    { id: 5, name: 'Otro documento' }
  ];

  // Para subir nuevos documentos
  newDocumentTypeId: number | null = null;
  newDocumentFile: File | null = null;
  uploadingDocument = false;

  // Estados de carga
  loadingCustomers = false;
  loadingRegions = false;
  loadingAddresses = false;
  loadingItems = false;

  // Selecciones
  selectedRegionIds: number[] = [];
  selectedAddressIds: number[] = [];
  selectedItemIds: number[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private contractService: ClientContractService,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    this.contractId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.contractId) {
      this.loadInitialData();
    } else {
      this.router.navigate(['/purchases/contracts-clients']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInitialData(): void {
    // Cargar datos base en paralelo
    forkJoin({
      items: this.contractService.getItems(),
      bondingCompanies: this.contractService.getBondingCompanies(),
      statuses: this.contractService.getContractStatuses()
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.items = result.items;
          this.bondingCompanies = result.bondingCompanies;
          this.contractStatuses = result.statuses || [];
        },
        error: (err) => console.error('Error cargando datos iniciales:', err)
      });

    this.loadCustomers();
    this.loadContract();
  }

  private loadContract(): void {
    this.loading = true;
    this.contractService.getContract(this.contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const data = response.data;
          if (data) {
            this.contract = {
              id: data.id || 0,
              customer_id: data.customer_id,
              project_name: data.project_name,
              description: data.description || '',
              region_ids: data.region_ids || (data.region_id ? [data.region_id] : []),
              start_date: data.start_date,
              end_date: data.end_date,
              min_amount: data.min_amount,
              max_amount: data.max_amount,
              contract_number: data.contract_number || '',
              licitation_number: data.licitation_number || '',
              address_ids: data.addresses?.map((a: any) => a.address_id || a.id) || [],
              item_ids: data.items?.map((i: any) => i.item_id) || [],
              has_bonding: data.has_bonding || false,
              bonding_company_id: data.bonding_company_id,
              bonding_amount: data.bonding_amount,
              bonding_start_date: data.bonding_start_date || '',
              bonding_end_date: data.bonding_end_date || '',
              alert_days_before: data.alert_days_before || 30,
              status_id: data.status_id
            };
            this.selectedRegionIds = this.contract.region_ids || [];
            this.customerCompany = data.customer_name || '';
            this.selectedAddressIds = this.contract.address_ids || [];
            this.selectedItemIds = this.contract.item_ids || [];

            // Inicializar las direcciones del contrato como customerAddresses
            // para que el ng-select pueda mostrar los items seleccionados
            if (data.addresses && data.addresses.length > 0) {
              this.customerAddresses = data.addresses.map((a: any) => ({
                id: a.address_id || a.id,
                shortname: a.shortname,
                address: a.address || a.full_address,
                street: a.street,
                city: a.city,
                state: a.state,
                region_id: 0
              }));
            }

            // Cargar regiones del cliente
            if (data.customer_id) {
              this.loadRegionsByCustomer(data.customer_id);
            }

            // Cargar documentos si existen
            if (data.documents && data.documents.length > 0) {
              this.contractDocuments = data.documents;
            }
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Error cargando contrato:', err);
          Swal.fire('Error', 'No se pudo cargar el contrato', 'error');
          this.loading = false;
          this.router.navigate(['/purchases/contracts-clients']);
        }
      });
  }

  private loadCustomers(): void {
    this.loadingCustomers = true;
    this.customerService.getCustomers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.customers = (response.data || []).map((c: any) => ({
            id: c.id,
            shortname: c.shortname,
            company: c.company,
            tax_id: c.tax_id
          }));
          this.loadingCustomers = false;
        },
        error: () => this.loadingCustomers = false
      });
  }

  private loadRegionsByCustomer(customerId: number): void {
    this.loadingRegions = true;
    this.contractService.getRegionsByCustomer(customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.customerRegionSystem = result.system;
          this.customerRegions = result.regions;
          this.loadingRegions = false;

          // Si hay regiones seleccionadas, cargar direcciones
          if (this.selectedRegionIds.length > 0) {
            this.loadAddressesByRegions();
          }
        },
        error: (err) => {
          console.error('Error cargando regiones:', err);
          this.loadingRegions = false;
          // Fallback: cargar regiones IMSS genéricas
          this.contractService.getIMSSRegions()
            .pipe(takeUntil(this.destroy$))
            .subscribe(regions => {
              this.customerRegions = regions.map(r => ({
                id: r.id,
                region_system_id: 1,
                code: r.code || '',
                name: r.name,
                is_active: true
              }));
            });
        }
      });
  }

  private loadAddressesByRegions(): void {
    if (!this.contract.customer_id || this.selectedRegionIds.length === 0) return;

    this.loadingAddresses = true;
    const currentlySelectedIds = [...this.selectedAddressIds];
    const currentAddresses = [...this.customerAddresses];

    this.contractService.getCustomerAddressesByRegions(
      this.contract.customer_id,
      this.selectedRegionIds
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (addresses) => {
          // Combinar direcciones nuevas con las que ya estaban seleccionadas
          // para no perder items que ya están en el modelo
          const newAddressMap = new Map(addresses.map(a => [a.id, a]));

          // Agregar las direcciones actuales que no están en las nuevas
          currentAddresses.forEach(addr => {
            if (!newAddressMap.has(addr.id) && currentlySelectedIds.includes(addr.id)) {
              newAddressMap.set(addr.id, addr);
            }
          });

          this.customerAddresses = Array.from(newAddressMap.values());
          this.loadingAddresses = false;
        },
        error: () => {
          this.loadingAddresses = false;
          this.loadAllCustomerAddresses();
        }
      });
  }

  private loadAllCustomerAddresses(): void {
    if (!this.contract.customer_id) return;

    this.loadingAddresses = true;
    this.contractService.getCustomerAddresses(this.contract.customer_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (addresses) => {
          this.customerAddresses = addresses;
          this.loadingAddresses = false;
        },
        error: () => this.loadingAddresses = false
      });
  }

  onCustomerChange(customer: CustomerOption | null): void {
    if (customer) {
      this.contract.customer_id = customer.id;
      this.customerCompany = customer.company;

      // Limpiar selecciones previas
      this.selectedRegionIds = [];
      this.selectedAddressIds = [];
      this.customerAddresses = [];
      this.customerRegions = [];

      this.loadRegionsByCustomer(customer.id);
    } else {
      this.contract.customer_id = 0;
      this.customerCompany = '';
      this.customerAddresses = [];
      this.customerRegions = [];
      this.selectedRegionIds = [];
      this.selectedAddressIds = [];
    }
  }

  onRegionsChange(): void {
    this.contract.region_ids = this.selectedRegionIds;
    this.selectedAddressIds = [];
    this.customerAddresses = [];

    if (this.contract.customer_id && this.selectedRegionIds.length > 0) {
      this.loadAddressesByRegions();
    }
  }

  onHasBondingChange(): void {
    if (!this.contract.has_bonding) {
      this.contract.bonding_company_id = undefined;
      this.contract.bonding_amount = undefined;
      this.contract.bonding_start_date = '';
      this.contract.bonding_end_date = '';
    }
  }

  isFormValid(): boolean {
    return !!(
      this.contract.customer_id &&
      this.contract.project_name?.trim() &&
      this.selectedRegionIds.length > 0 &&
      this.contract.start_date &&
      this.contract.end_date &&
      this.validateDates() &&
      this.validateAmounts() &&
      this.selectedAddressIds.length > 0 &&
      this.selectedItemIds.length > 0 &&
      (!this.contract.has_bonding || this.validateBonding())
    );
  }

  validateDates(): boolean {
    if (!this.contract.start_date || !this.contract.end_date) return true;
    return new Date(this.contract.end_date) >= new Date(this.contract.start_date);
  }

  validateAmounts(): boolean {
    return (this.contract.max_amount || 0) >= (this.contract.min_amount || 0);
  }

  validateBonding(): boolean {
    if (!this.contract.has_bonding) return true;
    return !!(
      this.contract.bonding_company_id &&
      this.contract.bonding_amount &&
      this.contract.bonding_amount > 0
    );
  }

  saveContract(): void {
    this.submitted = true;

    if (!this.isFormValid()) {
      Swal.fire('Error', 'Por favor complete todos los campos requeridos', 'error');
      return;
    }

    if (!this.validateDates()) {
      Swal.fire('Error', 'La fecha de fin debe ser posterior a la fecha de inicio', 'error');
      return;
    }

    const payload: ClientContractUpdateRequest = {
      ...this.contract,
      region_ids: this.selectedRegionIds,
      address_ids: this.selectedAddressIds,
      item_ids: this.selectedItemIds
    };

    this.saving = true;
    Swal.fire({
      title: 'Guardando...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.contractService.updateContract(this.contractId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          Swal.fire('Éxito', 'Contrato actualizado correctamente', 'success')
            .then(() => this.router.navigate(['/purchases/contracts-clients/show', this.contractId]));
        },
        error: (err) => {
          this.saving = false;
          Swal.fire('Error', err.error?.message || 'No se pudo actualizar el contrato', 'error');
        }
      });
  }

  goBack(): void {
    this.location.back();
  }

  customerSearchFn(term: string, item: CustomerOption): boolean {
    term = term.toLowerCase();
    return item.shortname?.toLowerCase().includes(term) ||
           item.company?.toLowerCase().includes(term) ||
           item.tax_id?.toLowerCase().includes(term) || false;
  }

  // Métodos para documentos
  getDocumentTypeName(typeId: number | undefined): string {
    if (!typeId) return 'Sin tipo';
    const type = this.documentTypes.find(t => t.id === typeId);
    return type?.name || `Tipo ${typeId}`;
  }

  formatFileSize(bytes: number | undefined): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  downloadDocument(doc: ContractDocument): void {
    if (!doc.download_url && !doc.filename) {
      Swal.fire('Error', 'No se puede descargar el documento', 'error');
      return;
    }

    // Usar el servicio para descargar
    const filename = doc.filename || 'documento';
    this.contractService.downloadDocument(this.contractId, filename)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = doc.original_name || filename;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          console.error('Error descargando documento:', err);
          Swal.fire('Error', 'No se pudo descargar el documento', 'error');
        }
      });
  }

  deleteDocument(doc: ContractDocument, index: number): void {
    Swal.fire({
      title: '¿Eliminar documento?',
      text: `¿Está seguro de eliminar "${doc.original_name || doc.filename}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const filename = doc.filename || '';
        this.contractService.deleteDocumentByFilename(this.contractId, filename)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.contractDocuments.splice(index, 1);
              Swal.fire('Eliminado', 'El documento ha sido eliminado', 'success');
            },
            error: (err) => {
              console.error('Error eliminando documento:', err);
              Swal.fire('Error', 'No se pudo eliminar el documento', 'error');
            }
          });
      }
    });
  }

  replaceDocument(doc: ContractDocument, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const filename = doc.filename || '';
    // Usar tipo de documento existente, o "Otro Documento" (ID 10) por defecto
    const documentTypeId = doc.document_type_id || 10;

    Swal.fire({
      title: '¿Reemplazar documento?',
      text: `¿Desea reemplazar "${doc.original_name || filename}" con "${file.name}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, reemplazar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.uploadingDocument = true;
        // Primero eliminar el documento existente
        this.contractService.deleteDocumentByFilename(this.contractId, filename)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              // Luego subir el nuevo archivo
              this.contractService.uploadDocument(this.contractId, documentTypeId, file)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                  next: () => {
                    this.uploadingDocument = false;
                    Swal.fire('Éxito', 'Documento reemplazado correctamente', 'success');
                    this.reloadDocuments();
                  },
                  error: (err) => {
                    this.uploadingDocument = false;
                    console.error('Error subiendo documento:', err);
                    Swal.fire('Error', err.error?.message || 'No se pudo subir el nuevo documento', 'error');
                  }
                });
            },
            error: (err) => {
              this.uploadingDocument = false;
              console.error('Error eliminando documento:', err);
              Swal.fire('Error', 'No se pudo eliminar el documento anterior', 'error');
            }
          });
      }
    });

    // Limpiar el input
    input.value = '';
  }

  onNewDocumentSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.newDocumentFile = input.files[0];
    } else {
      this.newDocumentFile = null;
    }
  }

  uploadNewDocument(inputRef: HTMLInputElement): void {
    if (!this.newDocumentFile || !this.newDocumentTypeId) {
      Swal.fire('Error', 'Seleccione un tipo de documento y un archivo', 'error');
      return;
    }

    this.uploadingDocument = true;
    this.contractService.uploadDocument(this.contractId, this.newDocumentTypeId, this.newDocumentFile)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.uploadingDocument = false;
          Swal.fire('Éxito', 'Documento subido correctamente', 'success');
          this.newDocumentFile = null;
          this.newDocumentTypeId = null;
          inputRef.value = '';
          this.reloadDocuments();
        },
        error: (err) => {
          this.uploadingDocument = false;
          console.error('Error subiendo documento:', err);
          Swal.fire('Error', err.error?.message || 'No se pudo subir el documento', 'error');
        }
      });
  }

  private reloadDocuments(): void {
    this.contractService.getContract(this.contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data?.documents) {
            this.contractDocuments = response.data.documents;
          }
        },
        error: (err) => console.error('Error recargando documentos:', err)
      });
  }
}
