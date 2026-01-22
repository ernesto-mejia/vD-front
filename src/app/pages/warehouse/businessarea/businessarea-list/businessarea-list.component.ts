import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import { AuthService } from '../../../../auth.service';
import { DataTablesModule } from 'angular-datatables';
import { Config } from 'datatables.net-dt';
import 'datatables.net-buttons-dt';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { apiEndpoint } from '../../../../shared/api-endpoint.util';

@Component({
  selector: 'app-businessarea-list',
  standalone: true,
  imports: [SidebarComponent, CommonModule, DataTablesModule],
  templateUrl: './businessarea-list.component.html',
  styleUrl: './businessarea-list.component.css',
})
export class BusinessareaListComponent implements OnInit, OnDestroy {
  errorMessage: string = '';
  response: any;
  dtOptions: Config = {};
  businessAreas: any[] = [];

  constructor(private authService: AuthService, private http: HttpClient) {}
  router = inject(Router);

  ngOnInit(): void {
    this.initializeDataTable();
  }

  initializeDataTable(): void {
    $(document).ready(() => {
      const token = this.getToken();
      $.ajax({
        url: apiEndpoint('business-area'),
        type: 'GET',
        cache: false,
        dataType: 'json',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        success: (response) => {
          this.businessAreas = response.businessAreas;
          $('#businessAreaTable').DataTable({
            destroy: true,
            data: this.businessAreas,
            columns: [
              { title: 'Nombre', data: 'name' },
              { title: 'Descripción', data: 'description' },
              { title: 'Activo', data: 'status' },
              { title: 'Codigo', data: 'code' },
              { title: 'Codigo Interno', data: 'internal_code' },
              { title: 'Slug', data: 'slug' },
              { title: 'Acciones', data: 'acciones' },
            ],
            lengthMenu: [
              [10, 25, 50, -1],
              [10, 25, 50, 'Todos'],
            ],
            //mrgn modified this to set one single row  of buttons, table and then footer standardized
            dom: '<"d-flex justify-content-between mb-3"Bf>rt<"d-flex justify-content-between mt-3"p li>',
            //dom: 'Bflr<"table-responsive"t>ip',
            language: {
              lengthMenu: '_MENU_ registros por página',
              info: 'Mostrando _TOTAL_ registro(s)',
              infoFiltered:
                ' filtrado(s) de un total de _MAX_ en _PAGES_ páginas',
              emptyTable: 'Sin información',
              paginate: {
                previous: 'Anterior',
                next: 'Siguiente',
              },
            },
            buttons: [
              {
                extend: 'excel',
                text: '<i class="fa fa-file-excel-o"></i> Exportar',
                filename: 'BusinessAreaList',
                class: 'excel',
                charset: 'utf-8',
                bom: true,
              },
              {
                extend: 'print',
                text: '<i class="fa fa-print"></i> Imprimir',
                filename: 'BusinessAreaList',
              },
            ],
          });

          // Agregar eventos de clic para los botones
          $('#businessAreaTable').on('click', '.edit-btn', (event) => {
            const businessAreaId = $(event.currentTarget).data(
              'business_area_id'
            );
            this.editBusinessArea(businessAreaId);
          });

          $('#businessAreaTable').on('click', '.settings-btn', (event) => {
            const businessAreaId = $(event.currentTarget).data(
              'business_area_id'
            );
            this.settingsBusinessArea(businessAreaId);
          });

          $('#businessAreaTable').on('click', '.view-btn', (event) => {
            const businessAreaId = $(event.currentTarget).data(
              'business_area_id'
            );
            this.businessAreaView(businessAreaId);
          });
        },
        error: (error) => {
          console.error('Error loading data:', error);
          this.errorMessage = 'Error al cargar los datos';
        },
      });
    });
  }

  editBusinessArea(businessAreaId: string): void {
    this.router.navigate(['/businessarea-edit', businessAreaId]);
  }

  settingsBusinessArea(businessAreaId: string): void {
    console.log('Configuraciones de área de negocio con ID:', businessAreaId);
  }

  ngOnDestroy(): void {
    // Elimina correctamente la tabla cuando el componente se destruya
    if ($.fn.dataTable.isDataTable('#businessAreaTable')) {
      $('#businessAreaTable').DataTable().destroy();
    }
  }

  businessAreaView(businessAreaId: string): void {
    this.router.navigate(['/businessarea-view', businessAreaId]);
  }

  private tokenKey = 'authToken'; // Clave para almacenar el token
  private getToken(): string | null {
    return localStorage.getItem(this.tokenKey); // Obtener el token guardado
  }
}
