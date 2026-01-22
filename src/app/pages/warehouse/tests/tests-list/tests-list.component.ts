import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { SidebarComponent } from "../../../sidebar/sidebar.component";
import { AuthService } from '../../../../auth.service';
import { DataTablesModule } from "angular-datatables";
import { Config } from 'datatables.net-dt';
import 'datatables.net-buttons-dt';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tests-list',
  standalone: true,
  imports: [SidebarComponent, CommonModule, DataTablesModule],
  templateUrl: './tests-list.component.html',
  styleUrls: ['./tests-list.component.css']
})
export class TestsListComponent implements OnInit, OnDestroy {
  errorMessage: string = '';
  response: any;
  dtOptions: Config = {};
  tests: any[] = [];

  constructor(private authService: AuthService, private http: HttpClient) {}
  router = inject(Router);

  ngOnInit(): void {
    this.initializeDataTable();
  }

  initializeDataTable(): void {
    $(document).ready(() => {
      $.ajax({
        url: 'http://localhost:8080/AuthTest/tests/viewAllTests',
        cache: false,
        dataType: 'json',
        success: (response) => {
          this.tests = response;
          $('#testsTable').DataTable({
            destroy: true,
            data: this.tests,
            columns: [
              { title: "Nombre", data: "nombre" },
              { title: "Código", data: "codigo" },
              { title: "Descripción", data: "descripcion" },
              { title: "Fecha de Creación", data: "fechaCreacion" },
              { title: "Número de Pruebas", data: "numeroPruebas" },
              {
                title: "Acciones",
                data: null,
                render: (data, type, row) => {
                  return `
                    <button class="btn btn-primary view-btn" data-id="${row.id}">Ver</button>
                    <button class="btn btn-warning edit-btn" data-id="${row.id}">Editar</button>
                    <button class="btn btn-secondary settings-btn" data-id="${row.id}">Configuraciones</button>
                  `;
                }
              }
            ],
            // Configuraciones de DataTable...
            lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "Todos"]],
            //dom: 'Bflr<"table-responsive"t>ip',
            //mrgn modified this to set one single row  of buttons, table and then footer standardized
            dom: '<"d-flex justify-content-between mb-3"Bf>rt<"d-flex justify-content-between mt-3"p li>',

            language: {
              lengthMenu: '_MENU_ registros por página',
              info: 'Mostrando _TOTAL_ registro(s)',
              infoFiltered: " filtrado(s) de un total de _MAX_ en _PAGES_ páginas",
              emptyTable: "Sin información",
              paginate: {
                previous: 'Anterior',
                next: 'Siguiente'
              },
            },
            buttons: [
              {
                extend: 'excel',
                text: '<i class="fa fa-file-excel-o"></i> Exportar',
                filename: 'TestsList',
                class: 'excel',
                charset: 'utf-8',
                bom: true,
              },
              {
                extend: 'print',
                text: '<i class="fa fa-print"></i> Imprimir',
                filename: 'TestsList',
              }
            ]
          });

          // Agregar eventos de clic para los botones
          $('#testsTable').on('click', '.edit-btn', (event) => {
            const testId = $(event.currentTarget).data('id');
            this.editTest(testId);
          });

          $('#testsTable').on('click', '.settings-btn', (event) => {
            const testId = $(event.currentTarget).data('id');
            this.settingsTest(testId);
          });

          $('#testsTable').on('click', '.view-btn', (event) => {
            const testId = $(event.currentTarget).data('id');
            this.viewTest(testId);
          });
        },
        error: (error) => {
          console.error('Error loading data:', error);
          this.errorMessage = 'Error al cargar los datos';
        }
      });
    });
  }

  editTest(testId: string): void {
    this.router.navigate(['/tests-edit', testId]);
  }

  settingsTest(testId: string): void {
    this.router.navigate(['/tests-settings', testId]);
  }

  viewTest(testId: string): void {
    this.router.navigate(['/tests-view', testId]);
  }

  ngOnDestroy(): void {
    // Elimina correctamente la tabla cuando el componente se destruya
    if ($.fn.dataTable.isDataTable('#testsTable')) {
      $('#testsTable').DataTable().destroy();
    }
  }
}
