import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { CommonModule, Location } from '@angular/common';
import { debounceTime, max, switchMap, takeUntil } from 'rxjs/operators';
import { Observable, of, Subject } from 'rxjs';

import { Router } from '@angular/router';

// MRGN added formsmodule to use ng
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { apiEndpoint } from '../../shared/api-endpoint.util';
import { ZipcodeService, ZipcodeFormData } from '../../shared/services/zipcode.service';

type ListNames = 'contacts' | 'addresses'; // Tipos de listas disponibles
declare var bootstrap: any; // Declara bootstrap para acceder a sus métodos

@Component({
  selector: 'app-company',
  standalone: true,
  imports: [SidebarComponent, CommonModule, FormsModule],
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.css'],
})
export class CompanyViewComponent implements OnInit {
  isEditing: boolean = false;
  actionButtonsDisabled: boolean = true; // Nueva variable para controlar el estado de los botones de acción
  showTabs: boolean = true; // Nueva variable para controlar la visibilidad de las pestañas
  submitted: boolean = false;

  companyId: string | null = null; // Almacena el ID de la Compañía
  generalInfo: any = null; // Información general de la Compañía
  contacts: any[] = []; // Inicializa como un arreglo vacío
  addresses: any = {}; // Inicializa como un objeto vacío

  //MRGN: Empiezo integracion de pantalla unica para companies
  xtax_regimes: any[] = [];
  tax_concepts: any = 'pruebax';
  xtax_concepts: any[] = [];
  xcompany_scope: any[] = [];

  ReadOnly: boolean = true;
  contracts: any[] = []; // MRGN added Lista de contratos
  documents: any[] = []; // MRGN added Lista de documentos
  XType: string = '';
  id_company_type: string | null = null;

  companydata: any = {
    id_company: 0,
    nombre_corto: '',
    nombre_fiscal: '',
    rfc: '',
    clave: '',
    tax_regime: null,
    tax_preferred_concept: null,
    tax_status: null,
    tax_byrules: null,
    tax_actofincorporation: null,
    id_company_type: null,
    id_company_scope: null,
    type: '',
    website: '',
  };

  modalTitle: string = '';
  modalFields: any[] = [];
  isModalEditMode: boolean = true; // Controla si el modal está en modo de edición o visualización
  newItem: any = {}; // Objeto para almacenar los nuevos datos
  searchResults: any[] = []; // Resultados de búsqueda
  //currentTab: string | null = null; // Inicialmente no hay pestaña seleccionada

  currentTab: string = 'contactos'; // Valor por defecto

  apiError: boolean = false;

  availableEquipments: any[] = []; // Lista de equipos disponibles

  // Variables para datos de código postal
  zipcodeData: ZipcodeFormData | null = null;
  loadingZipcode = false;
  settlements: string[] = [];
  hasMultipleSettlements = false;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private location: Location,
    private zipcodeService: ZipcodeService
  ) {}

  ngOnInit(): void {
    // Recupera la pestaña activa del localStorage
    const activeTab = localStorage.getItem('activeTab') || 'contactos'; // Valor por defecto si es null
    this.currentTab = activeTab;

    // Activar la pestaña correspondiente usando Bootstrap
    setTimeout(() => {
      const tabElement = document.querySelector(
        `a[href="#${this.currentTab}"]`
      );
      if (tabElement) {
        new bootstrap.Tab(tabElement).show(); // Activa la pestaña sin simular clic
      }
    }, 100); // Pequeño retraso para asegurar que el DOM esté listo

    this.contacts = [];
    this.addresses = [];

    const headers = { Authorization: `Bearer ${this.getToken()}` };
    this.companyId = this.route.snapshot.paramMap.get('id');
    this.id_company_type = this.route.snapshot.paramMap.get('Dataset_Type');

    if (this.id_company_type === '3') {
    }
    const okEditParam = this.route.snapshot.paramMap.get('OKEdit'); // Recupera el parámetro OKEdit

    // Configurar el estado de edición según el parámetro OKEdit
    if (this.companyId === '0' || okEditParam === '1') {
      this.ReadOnly = false;
      this.actionButtonsDisabled = false;
    } else {
      this.ReadOnly = true;
      this.actionButtonsDisabled = true;
    }

    // Obtener ID de la ruta
    if (this.companyId) {
      let tempurl = apiEndpoint('tax_regimes/list');
      this.http.get(tempurl, { headers }).subscribe({
        next: (data: any) => {
          this.xtax_regimes = data;
          if (this.xtax_regimes.length > 0) {
            this.companydata.tax_regime = this.xtax_regimes[0].tax_regime;
          }
          if (this.xtax_concepts.length > 0) {
            this.companydata.tax_preferred_concept =
              this.xtax_concepts[0].tax_concept;
          }
        },
      });

      this.http
        .get(apiEndpoint('company-scopes/list'), {
          headers,
        })
        .subscribe({
          next: (data: any) => {
            this.xcompany_scope = data;
            if (this.xtax_regimes.length > 0) {
              this.companydata.tax_regime = this.xtax_regimes[0].tax_regime;
            }
            if (this.xtax_concepts.length > 0) {
              this.companydata.tax_preferred_concept =
                this.xtax_concepts[0].tax_concept;
            }
            if (this.xcompany_scope.length > 0) {
              this.companydata.id_company_scope =
                this.xcompany_scope[0].id_company_scope;
            }
          },
        });

      this.http
        .get(apiEndpoint('tax_concepts/list'), {
          headers,
        })
        .subscribe({
          next: (data: any) => {
            this.xtax_concepts = data;
          },
        });

      if (this.companyId === '0') {
        this.ReadOnly = false;
        this.isEditing = true;
        this.actionButtonsDisabled = false; // Habilitar los botones de acción en modo de creación
        this.showTabs = false; // Ocultar las pestañas en modo de creación

        this.InitializeEmptyData(this.id_company_type);
      } else {
        this.loadCompanyDetails(this.companyId);
      }
    } else {
      console.error('No se recibió un ID válido.');
    }
    const lastTab = sessionStorage.getItem('lastTab');
    if (lastTab) {
      this.currentTab = lastTab;
      sessionStorage.removeItem('lastTab'); // Limpia después de usar
    } else {
      this.currentTab = 'OtraPestañaPorDefecto'; // si no hay nada guardado
    }

    this.loadAvailableEquipments();
  }
  loadAvailableEquipments(term: string = ''): void {
    const headers = { Authorization: `Bearer ${this.getToken()}` };
    const body = term ? { searchLikeEquipment: term } : {}; // Si hay un término, lo incluimos en el cuerpo

    this.http
      .post(apiEndpoint('equipments/list'), body, {
        headers,
      })
      .subscribe({
        next: (data: any) => {
          this.availableEquipments = data;
        },
        error: (error: any) => {
          console.error('Error al cargar la lista de equipos:', error);
        },
      });
  }

  // Método para establecer la pestaña actual
  setCurrentTab(tab: string): void {
    this.currentTab = tab; // Actualizamos la pestaña actual
    // Guardar la pestaña activa en el localStorage
    localStorage.setItem('activeTab', tab);
  }

  ngOnDestroy(): void {
    // Limpiar la pestaña activa del localStorage
    localStorage.removeItem('activeTab');
  }

  InitializeEmptyData(id_company_type: any): void {
    // JARED: Agrega aqui la rutina para crear un empty array en lugar de cargar companydetails
    this.contacts = []; // Inicializa como un arreglo vacío
    this.addresses = []; // Inicializa como un arreglo vacío
    //this.companydata = {"compania":{"id_company":9,"nombre_corto":"IMSS","nombre_fiscal":"INSTITUTO MEXICANO DEL SEGURO SOCIAL","rfc":"IMS421231I45","clave":"IMSS","tax_regime":"General de Ley Personas Morales","tax_preferred_concept":"P01","tax_status":1,"tax_byrules":1,"tax_actofincorporation":1,"type":"Customer","id_company_type":2},"Contactos":[{"id_contact":13,"contact_name":"Carlos","contact_lastname":"Cuevas","phone":"+52 55 7512 8790","email":"ccuevas@imss.gob.mx","job_position":null}],"Direcciones":[{"id_address":2,"shortname":"HES 14 VERACRUZ","address":"HES 14 VERACRUZ, 06140, Cuauhtémoc, México","country":"México","county":"-- Selecciona Estado --","city":"Cuauhtémoc","state":null,"zipcode":"06140","street":null,"outside_number":null,"inside_number":null,"id_contact":2,"contact_name":"DR. JOSE ANTONIO","contact_lastname":"SALAZAR","phone":null,"email":null,"job_position":null},{"id_address":3,"shortname":"HES CMN SIGLO XXI","address":"HES CMN SIGLO XXI","country":null,"county":null,"city":null,"state":null,"zipcode":null,"street":null,"outside_number":null,"inside_number":null,"id_contact":3,"contact_name":"DR. BERNARDO","contact_lastname":"SELPULVEDA GUTIERRREZ","phone":null,"email":null,"job_position":null},{"id_address":5,"shortname":"HGR 1 CD OBREGON","address":"HGR 1 CD OBREGON","country":null,"county":null,"city":null,"state":null,"zipcode":null,"street":null,"outside_number":null,"inside_number":null,"id_contact":4,"contact_name":"Edgar Armando","contact_lastname":"Corrales Glaxiola","phone":null,"email":null,"job_position":null},{"id_address":6,"shortname":"HGR 1 ORIZABA","address":"HGR 1 ORIZABA","country":null,"county":null,"city":null,"state":null,"zipcode":null,"street":null,"outside_number":null,"inside_number":null,"id_contact":5,"contact_name":"QFB. FLORA MARIA","contact_lastname":"COSMES JIMENEZ","phone":null,"email":null,"job_position":null},{"id_address":11,"shortname":"HGSMF 4 TECOMAN","address":"HGSMF 4 TECOMAN","country":null,"county":null,"city":null,"state":null,"zipcode":null,"street":null,"outside_number":null,"inside_number":null,"id_contact":6,"contact_name":"Alicia","contact_lastname":"Soto","phone":"+56 55 1130 7342","email":"asoto@pemex.com","job_position":null},{"id_address":221,"shortname":"nuevisima","address":"nuevisima, alkdfjlksj, 3943, Int. dfslj, 2932932, mexico, jalisco, mexico","country":"mexico","county":"adlkfjas","city":"mexico","state":"jalisco","zipcode":"2932932","street":"alkdfjlksj","outside_number":"3943","inside_number":"dfslj","id_contact":150,"contact_name":"maite","contact_lastname":"arguelles","phone":"345435435435","email":"maite@alsfdjasf.com","job_position":"Logistica"}],"Contracts":[{"id_contract":1,"id_parent":9,"contract_date":"2020-04-21","description":"Servicio Medico Integral SMI de Estudios de Laboratorio Clinico ELC Coordinacion de adquisicion de bienes y contratacion de servicios ","contract_number":"AA-050GYR988-E13-2020","reference_number":"PREI IMSS 136825","id_contract_status":2}]}

    this.companydata = {
      id_company: 0,
      nombre_corto: '',
      nombre_fiscal: '',
      rfc: '',
      clave: '',
      tax_regime: null,
      tax_preferred_concept: null,
      tax_status: null,
      tax_byrules: null,
      tax_actofincorporation: null,
      id_company_type: this.id_company_type,
      id_company_scope: null, // Inicialmente nulo
      type: this.XType, // Tipo de Cliente (será seleccionado por el usuario)
      website: '',
    };

    //this.id_company_type = this.route.snapshot.paramMap.get('Company_Type'); // Obtener ID de la ruta
    let xfindit =
      'select company_type,company_type_spanish from company_types where id_company_type = ' +
      this.id_company_type;
    this.postRequest(xfindit, 'identifyType2');

    /*
    this.XType="Desconocidos"
    if (this.id_company_type == '1') {
      console.log("es owner");
      this.XType = "Propietario";
      this.companydata.type = 'Owner';
    } else if (this.id_company_type == '2') {
      this.XType = "Cliente";
      console.log("es cliente");
      this.companydata.type = 'Customer';
    } else if (this.id_company_type == '3') {
      this.XType = "Proveedor";
      console.log("es Proveedor");
      this.companydata.type = 'Provider';
    } else if (this.id_company_type == '4') {
      this.XType = "Ambos";
      console.log("es ambos");
      this.companydata.type = 'Both';
    } else if (this.id_company_type == '5') {
      this.XType = "Surrogado";
      console.log("es surrogado");
      this.companydata.type = 'Surrogacy';
    } else if (this.id_company_type == '6') {
      this.XType = "Servicios";
      console.log("es servicios");
      this.companydata.type = 'Services';
    } else if (this.id_company_type == '7') {
      this.XType = "Transportista";
      console.log("es Transportista");
      this.companydata.type = 'Transportation';
    }
      */
  }

  loadCompanyDetails(companyId: string): void {
    const headers = { Authorization: `Bearer ${this.getToken()}` };

    this.http
      // .get(`http://localhost:8000/api/company/${supplierId}`, { headers })
      .get(apiEndpoint(`company/${companyId}`), {
        headers,
      })
      .subscribe({
        next: (data: any) => {
          this.companydata = data['compania']; // Asignar datos principales del proveedor
          this.contacts = data['Contactos']; // Asignar contactos
          this.addresses = data['Direcciones']; // Asignar direcciones
          this.contracts = data['Contracts']; // Carga contratos
          this.documents = data['Documents']; // Carga contratos

          this.id_company_type = this.companydata.id_company_type;

          let xfindit =
            "select company_type_spanish from company_types where company_type = '" +
            this.companydata.type +
            "'";
          this.postRequest(xfindit, 'identifyType');

          this.addresses = data['Direcciones']; // Asignar direcciones
        },
        error: (error: any) => {
          console.error('Error al cargar los detalles de la Compañía:', error);
        },
      });
  }

  goBack(): void {
    if (this.companyId) {
      this.loadCompanyDetails(this.companyId); // Recargar los datos
    }
    this.location.back();
    //this.router.navigate(['xcatalog/Companies/Proveedores/3'+this.id_company_type]); // Navegar de vuelta a la lista
  }

  postRequest(xInstruction: string, callerID: any): any {
    const token4 = this.getToken();
    const headers = { Authorization: `Bearer ${token4}` };
    let tempUrl4 = apiEndpoint('kpis/postCustom');
    let ajax_data: any;
    let body = {
      auth: 'qlkerAEGsdkR0',
      pCustom: xInstruction,
    };
    this.http
      .post(tempUrl4, body, { headers })
      .pipe()
      .subscribe({
        next: (response: any) => {
          if (callerID == 'identifyType') {
            this.XType = response[0].company_type_spanish;
          } else if (callerID == 'identifyType2') {
            this.XType = response[0].company_type_spanish;
            this.companydata.type = response[0].company_type;
          }

          return response;
        },
        error: (error: any) => {
          console.error('Error al buscar en postRequest:', error);
          return 'empty error';
        },
      });
  }

  editCompany(): void {
    this.ReadOnly = false;
    this.isEditing = true;
    this.actionButtonsDisabled = false; // Habilitar los botones de acción
  }

  saveContact(): void {
    // Verifica que todos los campos requeridos estén llenos
    if (
      !this.newContact.contact_name ||
      !this.newContact.contact_lastname ||
      !this.newContact.contact_lastname2 ||
      !this.newContact.phone ||
      !this.newContact.email ||
      !this.newContact.job_position
    ) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Todos los campos son obligatorios.',
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }

    // Agrega el nuevo contacto a la lista de contactos
    this.contacts.push({ ...this.newContact });

    // Resetea el formulario
    this.newContact = {
      contact_name: '',
      contact_lastname: '',
      contact_lastname2: '',
      phone: '',
      email: '',
      job_position: '',
      contact_department: '',
    };

    // Muestra un mensaje de éxito
    Swal.fire({
      icon: 'success',
      title: 'Contacto agregado',
      text: 'El contacto se ha guardado correctamente.',
      timer: 1500,
      showConfirmButton: false,
    });

    // Cierra el modal
    this.closeModal('addContactModal');
    this.cdr.detectChanges(); // Forzar la detección de cambios
    // Llamar a SaveData para guardar los datos y refrescar la página
    this.SaveData();
  }

  saveAddress(): void {
    // Construir la dirección concatenada antes de guardar
    this.newAddress.address = this.buildAddress(this.newAddress);

    // Agregar los campos id_address_equipment e id_equipment al objeto newAddress
    const newAddressPayload = {
      ...this.newAddress,
      id_equipment: this.newAddress.equipment || null, // Asegúrate de asignar el ID del equipo
    };

    this.addresses.push(newAddressPayload);

    // Resetear el formulario
    this.newAddress = {
      shortname: '',
      address: '',
      zipcode: '',
      street: '',
      outside_number: '',
      inside_number: '',
      city: '',
      county: '',
      state: '',
      country: '',
      contact_name: '',
      contact_lastname: '',
      contact_lastname2: '',
      phone: '',
      email: '',
      job_position: '',
      contact_department: '',
      equipment: null, // Resetear equipo
    };

    // Cerrar el modal y forzar la detección de cambios
    this.closeModal('addAddressModal');
    this.cdr.detectChanges(); // Forzar la detección de cambios

    // Llamar a SaveData para guardar los datos y refrescar la página
    this.SaveData();
  }
  // Método para cerrar modales
  closeModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
      document.body.classList.remove('modal-open');
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) backdrop.remove();
    }
    this.cdr.detectChanges(); // Forzar la detección de cambios
  }

  // Método para concatenar la dirección y asignarla al campo address
  buildAddress(address: any): string {
    const {
      shortname,
      street,
      outside_number,
      inside_number,
      zipcode,
      city,
      state,
      country,
    } = address;
    const addressParts = [
      shortname,
      street,
      outside_number,
      inside_number ? `Int. ${inside_number}` : '', // Corrige la sintaxis para inside_number
      zipcode,
      city,
      state,
      country,
    ].filter((part) => part); // Filtra partes vacías

    return addressParts.join(', '); // Une las partes con una coma y un espacio
  }

  SaveData(): void {
    // call here for update on restapi with data provided
    this.submitted = true; // Activar validaciones visuales

    // Validar campos obligatorios
    if (
      !this.companydata.nombre_fiscal ||
      !this.companydata.rfc ||
      !this.companydata.nombre_corto
    ) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, complete todos los campos requeridos.',
      });
      return;
    }
    let $msg = '';
    if (this.companydata.id_company == 0) {
      $msg = 'Nuevo registro ';
      // create
      this.CreateCompany();
    } else {
      $msg = 'Registro existente';
      // update
      this.UpdateCompany();
    }
    this.isEditing = false;
    this.ReadOnly = true;
    this.actionButtonsDisabled = true; // Deshabilitar los botones de acción
  }

  UpdateCompany(): void {
    // Verificar que los campos requeridos estén llenos
    if (
      !this.companydata.nombre_corto ||
      !this.companydata.nombre_fiscal ||
      !this.companydata.rfc
    ) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, complete todos los campos obligatorios.',
      });
      return;
    }

    // Mostrar alerta de confirmación antes de enviar
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas actualizar la información de la compañía?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, actualizar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        const headers = { Authorization: `Bearer ${this.getToken()}` };

        // Construir la dirección concatenada para cada dirección antes de enviar
        this.addresses.forEach((addressrecord: { address: string }) => {
          addressrecord.address = this.buildAddress(addressrecord);
        });

        // Construir el objeto updatedCompany
        const updatedCompany = {
          compania: {
            id_company: this.companydata.id_company,
            nombre: this.companydata.nombre_corto,
            nombre_fiscal: this.companydata.nombre_fiscal,
            rfc: this.companydata.rfc,
            clave: this.companydata.clave,
            type: this.companydata.type,
            website: this.companydata.website || null,
            tax_regime: this.companydata.tax_regime,
            tax_preferred_concept: this.companydata.tax_preferred_concept,
            tax_status: this.companydata.tax_status,
            tax_byrules: this.companydata.tax_byrules,
            tax_actofincorporation: this.companydata.tax_actofincorporation,
            id_company_type: this.companydata.id_company_type,
            id_company_scope: this.companydata.id_company_scope,
            Contactos: this.contacts, // Solo contactos con datos válidos
            Direcciones: this.addresses, // Solo direcciones con datos válidos
          },
        };

        // Enviar la solicitud PUT
        // let url = MainlibraryComponent.server_endpoint('company/') + `${this.companyId}`;
        let url = apiEndpoint(`company/${this.companyId}`);

        this.http.put(url, updatedCompany, { headers }).subscribe({
          next: () => {
            // Convertir id_company_type a número
            const companyType = Number(this.id_company_type);

            // Determinar el tipo de compañía para el mensaje
            let companyTypeMessage = '';
            switch (companyType) {
              case 1:
                companyTypeMessage = 'Propietario actualizado';
                break;
              case 2:
                companyTypeMessage = 'Cliente actualizado';
                break;
              case 3:
                companyTypeMessage = 'Proveedor actualizado';
                break;
              default:
                companyTypeMessage = 'Compañía actualizada';
                break;
            }

            Swal.fire({
              icon: 'success',
              title: companyTypeMessage,
              text: 'Los datos se han guardado correctamente.',
              timer: 2000,
              showConfirmButton: false,
            }).then(() => {
              // Recargar la página después de que la alerta desaparezca
              window.location.reload();
            });
          },
          error: (error: HttpErrorResponse) => {
            console.error('Error al actualizar la Compañía:', error);
            let errorMessage = 'No se pudo actualizar la Compañía.';
            if (error.status === 422 && error.error.errors) {
              const errorList = Object.values(error.error.errors)
                .flat()
                .map((err) => `<li>${err}</li>`)
                .join('');
              errorMessage = `<ul>${errorList}</ul>`;
            }
            Swal.fire({
              icon: 'error',
              title: 'Error',
              html: errorMessage,
            });
          },
        });

      }
    });
  }

  CreateCompany(): void {
    // Ajustar la estructura antes de enviarla
    const requestBody = {
      compania: {
        nombre: this.companydata.nombre_corto,
        nombre_fiscal: this.companydata.nombre_fiscal,
        rfc: this.companydata.rfc,
        clave: this.companydata.clave,
        id_company_type: this.id_company_type, // Conversión explícita a número
        website: this.companydata.website,
      },
    };

    const form = JSON.stringify(requestBody, null, 2);
    // Mostrar la estructura ajustada en formato JSON en la consola

    // Si todo está correcto, enviar los datos
    const headers = { Authorization: `Bearer ${this.getToken()}` };

    //this.http.post('http://localhost:8000/api/company', requestBody, { headers })
    this.http
      .post(apiEndpoint('company'), requestBody, {
        headers,
      })
      .subscribe(
        (response: any) => {
          // Notificación de éxito con SweetAlert2
          Swal.fire({
            icon: 'success',
            title: 'Compañía creada',
            text: 'La Compañía se ha creado correctamente.',
            timer: 3000, // Duración de 3 segundos
            showConfirmButton: false,
          }).then(() => {
            // Redirigir después de 3 segundos
            const newCompanyId = response.id_company; // Asegúrate de que el ID de la compañía creada esté en la respuesta
            this.router.navigate(['/company-edit', newCompanyId]);
          });
        },
        (error: HttpErrorResponse) => {
          let errorMessage = 'Se han encontrado los siguientes errores:\n\n';
          if (error.status === 422 && error.error.errors) {
            const errorList = Object.values(error.error.errors)
              .flat()
              .map((err) => `<li>${err}</li>`)
              .join('');
            errorMessage = `<ul>${errorList}</ul>`;
          } else {
            errorMessage +=
              'Error desconocido al procesar la solicitud. Por favor, inténtelo de nuevo.';
          }
          Swal.fire({
            icon: 'error',
            title: 'Error al crear la Compañía',
            html: errorMessage,
            showConfirmButton: true,
          });
        }
      );
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.ReadOnly = true;
    this.actionButtonsDisabled = true; // Deshabilitar los botones de acción
  }

  openModal(tab: string, item?: any, isEditMode: boolean = true): void {
    this.isModalEditMode = isEditMode; // Controlar si el modal está en modo de edición o visualización
    this.newItem = item ? { ...item } : {}; // Copiar el ítem si está en modo de edición

    let allowedit = 'Edición permitida';
    if (!isEditMode) {
      allowedit = 'Visualización';
    }
    this.modalTitle = tab + ' ' + allowedit;

    // Configurar los campos del modal según la pestaña
    switch (tab) {
      case 'Contactos':
        this.modalFields = [
          { id: 'SelectedTab', value: 'Contactos' }, // Asignar SelectedTab
          { id: 'contact_name', label: 'Nombre', type: 'text', required: true },
          {
            id: 'contact_lastname',
            label: 'Apellido',
            type: 'text',
            required: true,
          },
          { id: 'contact_lastname2', label: 'Apellido 2', type: 'text' },
          {
            id: 'phone',
            label: 'Teléfono',
            type: 'text',
            required: true,
            pattern: '^[0-9]{0,10}$', // Solo números, máximo 10
            maxlength: 10,
          },
          { id: 'email', label: 'Email', type: 'email', required: true },
          { id: 'job_position', label: 'Puesto', type: 'text', required: true },
          { id: 'contact_department', label: 'Departamento', type: 'text' },
        ];
        break;
      case 'Direcciones':
        // Verificar si existe `id_equipment` y asignar el equipo si está presente
        const selectedEquipment = item?.id_equipment || null;

        this.modalFields = [
          { id: 'SelectedTab', value: 'Direcciones' }, // Asignar SelectedTab
          {
            id: 'shortname',
            label: 'Nombre de la sucursal',
            type: 'text',
            required: true,
          },
          { id: 'street', label: 'Calle', type: 'text', required: true },
          {
            id: 'outside_number',
            label: 'Núm. Exterior',
            type: 'text',
            required: true,
          },
          { id: 'inside_number', label: 'Núm. Interior', type: 'text' },
          {
            id: 'zipcode',
            label: 'Código Postal',
            type: 'text',
            required: true,
          },
          { id: 'county', label: 'Alcaldia/Municipio', type: 'text' },
          { id: 'city', label: 'Ciudad', type: 'text' },
          { id: 'state', label: 'Estado', type: 'text' },
          { id: 'country', label: 'País', type: 'text' },
          { id: 'contact_name', label: 'Nombre del contacto', type: 'text' },
          {
            id: 'contact_lastname',
            label: 'Apellido del contacto',
            type: 'text',
          },
          {
            id: 'contact_lastname2',
            label: 'Apellido 2 del contacto',
            type: 'text',
          },
          { id: 'phone', label: 'Teléfono', type: 'text', maxlength: 10 },
          { id: 'email', label: 'Email', type: 'email' },
          { id: 'job_position', label: 'Puesto', type: 'text' },
          {
            id: 'contact_department',
            label: 'Departamento del contacto',
            type: 'text',
          },
        ];

        // Agregar el campo "Equipo asociado" solo si id_company_type no es 3
        if (this.id_company_type != '3') {
          this.modalFields.push({
            id: 'id_equipment',
            label: 'Equipo asociado',
            type: 'select',
            options: this.availableEquipments.map((equipment) => ({
              value: equipment.id_equipment, // Asegúrate de usar el ID del equipo como valor
              label: equipment.equipment, // El nombre del equipo como etiqueta
            })),
            value: this.newItem.id_equipment || null, // Asignar el ID del equipo seleccionado si existe
          });
        }
        break;
      default:
        this.modalFields = [];
        break;
    }

    // Abrir el modal
    const modal = document.getElementById('universalModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
      document.body.classList.add('modal-open');
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      document.body.appendChild(backdrop);
    }
  }
  // Agrega esta variable para controlar el modal
  private addressModal: any;

  // Método para abrir el modal
  openAddAddressModal(): void {

    // Resetear los campos
    this.newAddress = {
      shortname: '',
      address: '',
      zipcode: '',
      street: '',
      outside_number: '',
      inside_number: '',
      city: '',
      county: '',
      state: '',
      country: '',
      contact_name: '',
      contact_lastname: '',
      phone: '',
      email: '',
      job_position: '',
      contact_department: '',
      equipment: null, // Inicializar el equipo como null
    };

    // Inicializar el modal de Bootstrap
    const modalElement = document.getElementById('addAddressModal');
    if (modalElement) {
      this.addressModal = new bootstrap.Modal(modalElement);
      this.addressModal.show();

      // Limpiar eventos previos y agregar nuevos
      modalElement.removeEventListener(
        'hidden.bs.modal',
        this.handleModalClose.bind(this)
      );
      modalElement.addEventListener(
        'hidden.bs.modal',
        this.handleModalClose.bind(this)
      );
    }
  }

  // Método para manejar el cierre
  handleModalClose(): void {
    // Limpiar cualquier backdrop residual
    const backdrops = document.getElementsByClassName('modal-backdrop');
    while (backdrops.length > 0) {
      backdrops[0].remove();
    }

    // Habilitar el scroll del cuerpo
    document.body.style.overflow = 'auto';
    document.body.style.paddingRight = '';
  }

  // Método para cerrar el modal manualmente
  closeAddressModal(): void {
    if (this.addressModal) {
      this.addressModal.hide();
      this.handleModalClose();
    }
  }

  // Método para guardar el ítem del modal universal
  saveItem(): void {
    // Validar que los campos no estén vacíos
    if (
      this.modalFields.some(
        (field) => field.required && !this.newItem[field.id]
      )
    ) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Todos los campos obligatorios deben ser llenados.',
      });
      return;
    }

    // Convertir la fecha a un formato de texto si es necesario
    this.modalFields.forEach((field) => {
      if (field.type === 'date' && this.newItem[field.id]) {
        this.newItem[field.id] = new Date(this.newItem[field.id])
          .toISOString()
          .split('T')[0];
      }
    });

    // Identificar la pestaña actual
    let XTab = this.modalFields.find(
      (field) => field.id === 'SelectedTab'
    )?.value;

    let payload: any;
    let endpoint: string;

    switch (XTab) {
      case 'Contactos':
        payload = {
          id_contact: this.newItem.id_contact,
          parent_table: 'companies',
          id_parent: this.companyId,
          contact_name: this.newItem.contact_name,
          contact_lastname: this.newItem.contact_lastname,
          contact_lastname2: this.newItem.contact_lastname2,
          contact_phone: this.newItem.phone,
          contact_email: this.newItem.email,
          contact_job_position: this.newItem.job_position,
          contact_department: this.newItem.contact_department,
        };
        endpoint = `contacts/update/${this.newItem.id_contact}`;

        break;

      case 'Direcciones':
        payload = {
          id_address: parseInt(this.newItem.id_address, 10),
          parent_table: 'companies',
          id_parent: parseInt(this.companyId!, 10),
          id_company: parseInt(this.companyId!, 10),
          shortname: this.newItem.shortname,
          address: this.buildAddress(this.newItem),
          zipcode: this.newItem.zipcode,
          street: this.newItem.street,
          outside_number: this.newItem.outside_number,
          inside_number: this.newItem.inside_number,
          city: this.newItem.city,
          county: this.newItem.county,
          state: this.newItem.state,
          country: this.newItem.country,
          contact_name: this.newItem.contact_name,
          contact_lastname: this.newItem.contact_lastname,
          contact_lastname2: this.newItem.contact_lastname2,
          phone: this.newItem.phone,
          email: this.newItem.email,
          job_position: this.newItem.job_position,
          contact_department: this.newItem.contact_department,
          id_equipment: this.newItem.id_equipment
            ? parseInt(this.newItem.id_equipment, 10)
            : null, // Asegúrate de que sea un número o null
          id_address_equipment: this.newItem.id_address_equipment
            ? parseInt(this.newItem.id_address_equipment, 10)
            : null, // Asegúrate de que sea un número o null
        };
        endpoint = `addresses/update/${this.newItem.id_address}`;
        break;

      default:
        console.error('Sección no reconocida:', XTab);
        return;
    }

    // Llamar a updateItem para actualizar el ítem
    this.updateItem(
      this.newItem.id_contact || this.newItem.id_address,
      endpoint,
      payload
    );
  }

  // Método para actualizar un ítem existente
  updateItem(
    id: number, // ID del elemento a actualizar
    endpoint: string, // Endpoint de la API (por ejemplo, 'replacement-equivalents/update')
    payload: any // Datos que se enviarán en el cuerpo de la solicitud PUT
  ): void {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
      'Content-Type': 'application/json',
    });

    // this.http.put(`http://localhost:8000/api/${endpoint}`, payload, { headers }).subscribe({
    this.http
      .put(apiEndpoint(endpoint), payload, {
        headers,
      })
      .subscribe({
        next: (response: any) => {
          console.log(response);

          if (endpoint.includes('contacts')) {
            const index = this.contacts.findIndex(
              (contact) => contact.id_contact === id
            );
            if (index !== -1) {
              this.contacts[index] = { ...response };
            }
          } else if (endpoint.includes('addresses')) {
            const index = this.addresses.findIndex(
              (address: any) => address.id_address === id
            );
            if (index !== -1) {
              this.addresses[index] = { ...response };
            }
          }
          Swal.fire({
            icon: 'success',
            title: 'Actualizado',
            text: 'El ítem se ha actualizado correctamente.',
            timer: 1500,
            showConfirmButton: false,
          });
          this.closeModal('universalModal');
          window.location.reload();
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error al actualizar el ítem:', error);
          let errorMessage = 'No se pudo actualizar el ítem.';
          if (error.status === 422 && error.error.errors) {
            const errorList = Object.values(error.error.errors)
              .flat()
              .map((err) => `<li>${err}</li>`)
              .join('');
            errorMessage = `<ul>${errorList}</ul>`;
          }
          Swal.fire({
            icon: 'error',
            title: 'Error',
            html: errorMessage,
          });
        },
      });
  }

  // Método para manejar el evento de entrada en el campo de búsqueda
  handleSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target) {
      const term = target.value;
      if (term.length < 3) {
        this.searchResults = [];
        return;
      }

      const headers = { Authorization: `Bearer ${this.getToken()}` };
      let apiUrl: string;

      if (this.currentTab === 'Contactos') {
        apiUrl = apiEndpoint('contacts/search');
      } else if (this.currentTab === 'Direcciones') {
        apiUrl = apiEndpoint('addresses/search');
      } else {
        return;
      }

      this.http.post(apiUrl, { term }, { headers }).subscribe({
        next: (data: any) => {
          this.searchResults = data;
        },
        error: (error: any) => {
          console.error('Error al buscar:', error);
        },
      });
    }
  }

  // Método para seleccionar un ítem de los resultados de búsqueda
  onSelectInventory(result: any): void {
    this.newItem = { ...result };
    this.searchResults = [];
  }

  // Método para manejar el cambio de estado de los checkboxes
  onCheckboxChange(
    field: string,
    event: Event,
    isModal: boolean = false
  ): void {
    const target = event.target as HTMLInputElement;
    if (target) {
      if (isModal) {
        this.newItem[field] = target.checked;
      } else {
        this.companydata[field] = target.checked ? 1 : 0;
      }
    }
  }

  deleteItem(
    id: number, // ID del elemento a eliminar
    endpoint: string, // Endpoint de la API
    listName: ListNames // Nombre de la lista
  ): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertir esta acción',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json',
        });

        // Aplicar debounce a la solicitud DELETE
        of(id)
          .pipe(
            debounceTime(500), // Espera 300ms antes de hacer la solicitud
            switchMap((itemId) =>
              this.http.delete(apiEndpoint(`${endpoint}/${itemId}`), {
                headers,
              })
            )
            //switchMap(itemId => this.http.delete(`http://localhost:8000/api/${endpoint}/${itemId}`, {}))
          )
          .subscribe({
            next: () => {
              // Eliminar el elemento de la lista localmente
              this[listName] = this[listName].filter(
                (item: any) => item.id !== id
              );

              // Mostrar mensaje de éxito
              Swal.fire({
                icon: 'success',
                title: 'Eliminado',
                text: 'El elemento ha sido eliminado correctamente.',
                timer: 1500,
                showConfirmButton: false,
              });

              // No es necesario recargar la página completa
              window.location.reload();
            },
            error: (error: HttpErrorResponse) => {
              console.error('Error al eliminar el elemento:', error);
              let errorMessage = 'No se pudo eliminar el elemento.';
              if (error.status === 422 && error.error.errors) {
                const errorList = Object.values(error.error.errors)
                  .flat()
                  .map((err) => `<li>${err}</li>`)
                  .join('');
                errorMessage = `<ul>${errorList}</ul>`;
              }
              Swal.fire({
                icon: 'error',
                title: 'Error',
                html: errorMessage,
              });
            },
          });
      }
    });
  }

  deleteContact(id_contact: number): void {
    this.deleteItem(
      id_contact,
      'contacts/delete',
      'contacts' // Solo pasamos 3 argumentos
    );
  }

  deleteAddress(id_address: number): void {
    this.deleteItem(id_address, 'address/delete', 'addresses');
  }

  handleSaveContact(): void {
    this.submitted = true; // Activar validaciones visuales

    if (this.companyId === '0') {
      // Si el companyId es "0", significa que estamos creando una nueva compañía
      // Validar que los campos no estén vacíos
      if (
        !this.newContact.contact_name ||
        !this.newContact.contact_lastname ||
        !this.newContact.email
      ) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Todos los campos obligatorios deben ser llenados.',
        });
        return;
      }

      // Agregar el nuevo contacto a la lista de contactos
      this.contacts.push({ ...this.newContact });

      // Limpiar el formulario
      this.newContact = {
        contact_name: '',
        contact_lastname: '',
        contact_lastname2: '',
        phone: '',
        email: '',
        job_position: '',
        contact_department: '',
      };

      this.submitted = false; // Reiniciar el estado de validación

      // Mostrar mensaje de éxito
      Swal.fire({
        icon: 'success',
        title: 'Contacto agregado',
        text: 'El contacto se ha guardado correctamente.',
        timer: 1500,
        showConfirmButton: false,
      });

      // Cerrar el modal
      this.closeModal('addContactModal');
    } else {
      // Si el companyId no es "0", significa que estamos editando una compañía existente
      // Aquí puedes llamar a una función para actualizar el contacto en la API
      this.saveContact();
    }
  }

  handleSaveAddress(): void {
    this.saveAddress();
  }

  saveNewCompany(): void {
    this.submitted = true; // Activar validaciones visuales

    // Validar campos obligatorios
    if (
      !this.companydata.nombre_fiscal ||
      !this.companydata.rfc ||
      !this.companydata.nombre_corto
    ) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, complete todos los campos requeridos.',
      });
      return;
    }

    const newCompany = {
      compania: {
        nombre: this.companydata.nombre_corto,
        nombre_fiscal: this.companydata.nombre_fiscal,
        rfc: this.companydata.rfc,
        clave: this.companydata.clave,
        id_company_type: this.id_company_type,
        website: this.companydata.website,
        tax_regime: this.companydata.tax_regime,
        tax_preferred_concept: this.companydata.tax_preferred_concept,
        tax_status: this.companydata.tax_status,
        tax_byrules: this.companydata.tax_byrules,
        tax_actofincorporation: this.companydata.tax_actofincorporation,
        id_company_scope: this.companydata.id_company_scope,
      },
      contactos: this.contacts.map((contact) => ({
        contact_name: contact.contact_name,
        contact_lastname: contact.contact_lastname,
        contact_lastname2: contact.contact_lastname2,
        phone: contact.phone,
        email: contact.email,
        job_position: contact.job_position,
        contact_department: contact.contact_department,
      })),
      direcciones: this.addresses.map((address: any) => ({
        shortname: address.shortname,
        address: address.address,
        country: address.country,
        county: address.county,
        city: address.city,
        state: address.state,
        zipcode: address.zipcode,
        street: address.street,
        outside_number: address.outside_number,
        inside_number: address.inside_number,
        contact_name: address.contact_name,
        contact_lastname: address.contact_lastname,
        phone: address.phone,
        email: address.email,
        job_position: address.job_position,
      })),
    };

    const headers = { Authorization: `Bearer ${this.getToken()}` };

    this.http.post(apiEndpoint('company'), newCompany, { headers }).subscribe(
      (response: any) => {
        Swal.fire({
          icon: 'success',
          title: 'Compañía creada',
          text: 'La Compañía se ha creado correctamente.',
          timer: 3000,
          showConfirmButton: false,
        }).then(() => {
          const newCompanyId = response.company.id_company;
          this.router
            .navigate(['/company', this.id_company_type, newCompanyId, '1'])
            .then(() => {
              window.location.reload();
            });
        });
      },
      (error: HttpErrorResponse) => {
        console.error('Error al crear la Compañía:', error);
        let errorMessage = 'Se han encontrado los siguientes errores:\n\n';
        if (error.status === 422 && error.error.errors) {
          const errorList = Object.values(error.error.errors)
            .flat()
            .map((err) => `<li>${err}</li>`)
            .join('');
          errorMessage = `<ul>${errorList}</ul>`;
        } else {
          errorMessage +=
            'Error desconocido al procesar la solicitud. Por favor, inténtelo de nuevo.';
        }
        Swal.fire({
          icon: 'error',
          title: 'Error al crear la Compañía',
          html: errorMessage,
          showConfirmButton: true,
        });
      }
    );
  }

  deleteHandle(index: number, listName: string): void {
    switch (listName) {
      case 'contacts':
        this.contacts.splice(index, 1);
        break;
      case 'addresses':
        this.addresses.splice(index, 1);
        break;
      default:
        console.error('Lista no reconocida:', listName);
        return;
    }

    Swal.fire({
      icon: 'success',
      title: 'Eliminado',
      text: 'El elemento ha sido eliminado correctamente.',
      timer: 1500,
      showConfirmButton: false,
    });
  }

  private tokenKey = 'authToken'; // Clave para almacenar el token
  private getToken(): string | null {
    return localStorage.getItem(this.tokenKey); // Obtener el token guardado
  }

  //ZIPCODES
  counties: string[] = [];
  cities: string[] = [];
  states: string[] = [];
  countries: string[] = [];

  onZipcodeInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const zipcode = target.value?.trim();

    // Limpiar datos anteriores si el código postal cambió
    if (zipcode.length < 5) {
      this.resetZipcodeData();
      return;
    }

    if (zipcode.length === 5 && this.zipcodeService.isValidZipcode(zipcode)) {
      this.loadingZipcode = true;
      this.apiError = false;
      this.zipcodeService.getAddressByZipcode(zipcode)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data: ZipcodeFormData | null) => {
            this.loadingZipcode = false;
            if (data) {
              this.zipcodeData = data;
              this.settlements = data.settlements;
              this.hasMultipleSettlements = data.hasMultipleSettlements;

              // Autocompletar campos
              this.newAddress.country = data.country === 'México' ? 'MX' : data.country;
              this.newAddress.state = data.state;
              this.newAddress.city = data.city;
              this.newAddress.county = data.county;

              // Si solo hay una colonia, seleccionarla automáticamente
              if (data.settlements.length === 1) {
                this.newAddress.colony = data.settlements[0];
              } else if (data.settlements.length > 1) {
                // Si hay múltiples, limpiar para que el usuario seleccione
                this.newAddress.colony = '';
              }
              this.updateAddressField();
            } else {
              this.resetZipcodeData();
              this.showZipcodeNotFoundAlert();
            }
          },
          error: () => {
            this.loadingZipcode = false;
            this.apiError = true;
            this.resetZipcodeData();
            this.showZipcodeNotFoundAlert();
          }
        });
    }
  }

  /**
   * Reinicia los datos del código postal
   */
  private resetZipcodeData(): void {
    this.zipcodeData = null;
    this.settlements = [];
    this.hasMultipleSettlements = false;
  }

  showZipcodeNotFoundAlert(): void {
    Swal.fire({
      icon: 'info',
      title: 'Código postal no encontrado',
      text: 'No se encontró información para este código postal. Por favor, complete los campos manualmente.',
      confirmButtonText: 'Entendido',
    });
  }

  updateAddressField(): void {
    const {
      shortname,
      street,
      outside_number,
      inside_number,
      zipcode,
      city,
      state,
      country,
      county,
    } = this.newAddress;
    const addressParts = [
      shortname,
      street,
      outside_number ? `#${outside_number}` : '',
      inside_number ? `Int. ${inside_number}` : '',
      zipcode,
      county, // <- Añadimos Alcaldía/Municipio
      city,
      state,
      country,
    ].filter((part) => part && part.trim() !== ''); // Filtra partes vacías o con solo espacios

    this.newAddress.address = addressParts.join(', ');
  }

  // Nuevo contacto y dirección
  newContact: any = {
    contact_name: '',
    contact_lastname: '',
    contact_lastname2: '',
    phone: '',
    email: '',
    job_position: '', // Nuevo campo
  };

  newAddress: any = {
    shortname: '',
    address: '', // Este campo se llenará con la concatenación
    zipcode: '',
    street: '',
    outside_number: '',
    inside_number: '',
    city: '', // Nuevo campo para ciudad
    county: '', // Nuevo campo para Alcaldia/Municipio
    state: '', // Nuevo campo para estado
    country: '', // Nuevo campo para país
    contact_name: '',
    contact_lastname: '',
    phone: '',
    email: '',
    job_position: '', // Nuevo campo
    contact_department: '', // Nuevo campo para departamento
    equipment: null, // Equipo asociado
  };

  ShowDocument(xID: string): void {
    // Guarda en sessionStorage que venías del tab "Documentos"
    sessionStorage.setItem('lastTab', 'Documentos');
    this.router.navigate(['/document/0/' + xID + '/0']);
  }

  validateRFC(rfc: string): void {
    if (!rfc) return;

    rfc = rfc.toUpperCase().trim();

    const regexMoral = /^[A-ZÑ&]{3}\d{6}[A-Z0-9]{3}$/;
    const regexFisica = /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/;

    if (rfc.length === 12 && regexMoral.test(rfc)) {
      Swal.fire({
        icon: 'success',
        title: 'RFC válido',
        text: 'Este RFC corresponde a una Persona Moral',
      });
    } else if (rfc.length === 13 && regexFisica.test(rfc)) {
      Swal.fire({
        icon: 'success',
        title: 'RFC válido',
        text: 'Este RFC corresponde a una Persona Física',
      });
    } else {
      this.companydata.rfc = '';

      Swal.fire({
        icon: 'error',
        title: 'RFC inválido',
        text: 'El RFC no cumple con el formato requerido.',
      });
    }
  }

  ShowContract(xID: string): void {
    // Guarda en sessionStorage que venías del tab "Documentos" contracts/2/26/0
    sessionStorage.setItem('lastTab', 'Contratos');
    this.router.navigate(['/contracts/2/' + xID + '/0']);
  }

  validatePhoneInput(event: any): void {
    const input = event.target as HTMLInputElement;

    // Elimina cualquier carácter que no sea número
    input.value = input.value.replace(/[^0-9]/g, '');

    // Limita a 10 caracteres
    if (input.value.length > 10) {
      input.value = input.value.substring(0, 10);
    }
  }
}
