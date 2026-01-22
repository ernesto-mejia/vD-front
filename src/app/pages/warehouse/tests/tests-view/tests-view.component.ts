import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from "../../../sidebar/sidebar.component";
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tests-view',
  standalone: true,
  imports: [SidebarComponent, CommonModule],
  templateUrl: './tests-view.component.html',
  styleUrls: ['./tests-view.component.css']
})
export class TestsViewComponent implements OnInit {
  test: any = null; // Almacena los datos de la prueba
  testId: string | null = null; // Almacena el ID de la prueba

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.testId = this.route.snapshot.paramMap.get('testId'); // Obtener ID de la ruta
    if (this.testId) {
      this.loadTestDetails(this.testId);
    } else {
      console.error('No se recibió un ID válido.');
    }
  }

  loadTestDetails(testId: string): void {
    this.http
      .get(`http://localhost:8080/AuthTest/tests/view/${testId}`)
      .subscribe({
        next: (data: any) => {
          this.test = data; // Asignar datos de la prueba
        },
        error: (error: any) => {
          console.error('Error al cargar los detalles de la prueba:', error);
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/tests-list']); // Navegar de vuelta a la lista
  }

  editTest(): void {
    if (this.testId) {
      this.router.navigate(['/tests-edit', this.testId]); // Navegar a la edición
    } else {
      console.error('No se puede navegar a la edición porque el ID de la prueba es inválido.');
    }
  }
}