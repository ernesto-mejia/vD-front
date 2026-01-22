import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from "../../../sidebar/sidebar.component";
import { AuthService } from '../../../../auth.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-tests-create',
  standalone: true,
  imports: [SidebarComponent, FormsModule, CommonModule],
  templateUrl: './tests-create.component.html',
  styleUrls: ['./tests-create.component.css']
})
export class TestsCreateComponent {
  errorMessage: string = '';
  test = {
    nombrePrueba: '',
    claveEstudio: '',
    claveSat: '',
    descripcion: '',
    claveInterna: '',
    equipos: [],
    kit: null
  };
  response: any;
  equipos: any[] = [];
  kits: any[] = [];
  reactivos: any[] = [];
  selectedKit: any = null;
  selectedReactivos: any[] = [];
  reactivoCantidad: number = 1;

  constructor(private authService: AuthService, private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadEquipos();
    this.loadKits();
    this.loadReactivos();
  }

  loadEquipos(): void {
    // Simula una llamada HTTP para obtener los equipos
    this.equipos = [
      { nombre: 'Equipo 1' },
      { nombre: 'Equipo 2' }
    ];
  }

  loadKits(): void {
    // Simula una llamada HTTP para obtener los kits
    this.kits = [
      { nombre: 'Kit 1', descripcion: 'Descripción del Kit 1', items: ['Item 1', 'Item 2'] },
      { nombre: 'Kit 2', descripcion: 'Descripción del Kit 2', items: ['Item 3', 'Item 4'] }
    ];
  }

  loadReactivos(): void {
    // Simula una llamada HTTP para obtener los reactivos
    this.reactivos = [
      { nombre: 'Reactivo 1' },
      { nombre: 'Reactivo 2' }
    ];
  }

  onKitChange(): void {
    this.selectedKit = this.kits.find(kit => kit.nombre === this.test.kit);
  }

  openReactivosModal(): void {
    // Abre el modal para agregar reactivos
    $('#reactivosModal').show();
  }

  addReactivo(): void {
    // Lógica para agregar reactivos seleccionados
    this.selectedReactivos.forEach(reactivo => {
      // this.test.reactivos.push({ reactivo, cantidad: this.reactivoCantidad });
    });
    $('#reactivosModal').hide();
  }

  onSubmit() {
    this.http.post('http://localhost:8080/AuthTest/tests/create', this.test)
      .subscribe(response => {
        this.router.navigate(['/tests-list']);
      }, error => {
        this.errorMessage = 'Error al crear la prueba. Por favor, inténtelo de nuevo.';
      });
  }

  goBack() {
    this.router.navigate(['/tests-list']);
  }
}
