import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from "../../../sidebar/sidebar.component";
import { AuthService } from '../../../../auth.service';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-tests-edit',
  standalone: true,
  imports: [SidebarComponent, FormsModule],
  templateUrl: './tests-edit.component.html',
  styleUrls: ['./tests-edit.component.css']
})
export class TestsEditComponent implements OnInit {
  errorMessage: string = '';
  testId: string | null = null;
  test = {
    nombrePrueba: '',
    claveEstudio: '',
    claveSat: '',
    status: 'activo',
    descripcion: '',
    claveInterna: ''
  };
  response: any;

  constructor(private authService: AuthService, private http: HttpClient, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.testId = this.route.snapshot.paramMap.get('testId');
    if (this.testId) {
      this.loadTestDetails(this.testId);
    } else {
      console.error('No se recibió un ID válido.');
    }
  }

  loadTestDetails(testId: string): void {
    this.http.get(`http://localhost:8080/AuthTest/tests/view/${testId}`)
      .subscribe(response => {
        this.test = response as any;
      }, error => {
        console.error('Error al cargar los detalles de la prueba:', error);
        this.errorMessage = 'Error al cargar los detalles de la prueba. Por favor, inténtelo de nuevo.';
      });
  }

  onSubmit() {
    this.http.post(`http://localhost:8080/AuthTest/tests/update/${this.testId}`, this.test)
      .subscribe(response => {
        this.router.navigate(['/tests-list']);
      }, error => {
        console.error('Error al actualizar la prueba:', error);
        this.errorMessage = 'Error al actualizar la prueba. Por favor, inténtelo de nuevo.';
      });
  }

  goBack() {
    this.router.navigate(['/tests-list']);
  }
}
