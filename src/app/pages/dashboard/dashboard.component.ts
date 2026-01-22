import { Component, inject, OnInit, AfterViewInit, OnDestroy  } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarComponent } from "../sidebar/sidebar.component";

import * as am5 from "@amcharts/amcharts5";
//import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import * as am5percent from "@amcharts/amcharts5/percent";
import Swal from 'sweetalert2';
import { HttpClient, HttpHeaders,HttpErrorResponse } from '@angular/common/http';

import { CommonModule, NgIf, Location,   } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService } from './dashboard.service';
import { Kpi } from './kpi.model';




@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent, FormsModule, NgIf],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  constructor(
    private http: HttpClient,
    private location: Location,
    private dashboardService: DashboardService,
  ) { }

  private root!: am5.Root;

  kpis: Kpi[] = [];
  dataset : any[]=[];

  token0: any;


  ngOnInit(): void {


    Swal.fire({
      title: '<div style="font-size: 24px; color: #2c3e50;"><i class="fas fa-code-branch" style="margin-right: 10px;"></i>EPICA Versió 0.995 ALPHA</div>',
      html: `
        <div style="text-align: left; line-height: 1.6;">
          <p style="font-size: 15px; margin-bottom: 15px;">
            <i class="fas fa-exclamation-triangle" style="color: #f39c12; margin-right: 8px;"></i>
            <strong>Versión en desarrollo activo</strong> - EPICA Versión ALPHA 0.995 tiene cambios constantemente y puede tener módulos que son de representación o ilustración.
          </p>

          <div style="background-color: #f8f9fa; padding: 12px; border-radius: 6px; border-left: 4px solid #3498db; margin-bottom: 15px;">
            <p style="margin: 0;">
              <i class="fas fa-info-circle" style="color: #3498db; margin-right: 8px;"></i>
            <ul style="padding-left: 20px; margin-bottom: 0;">
            <li style="margin-bottom: 8px;">Actualizaciones diarias de características</li>
            <li style="margin-bottom: 8px;">Puede contener elementos en fase de prueba</li>
            <li>Reporte cualquier anomalía al equipo técnico</li>
          </ul>
            </p>
          </div>


        </div>
      `,
      icon: 'info',
      confirmButtonText: '<i class="fas fa-check-circle" style="margin-right: 5px;"></i> Entendido',
      confirmButtonColor: '#3498db',
      width: '600px',
      customClass: {
        popup: 'animated fadeIn faster',
        title: 'swal-title-custom',
        htmlContainer: 'swal-html-container-custom'
      },
      backdrop: `
        rgba(52, 73, 94,0.5)
        center top
        no-repeat
      `
    });
      this.loadKPIs();
      // this.getMainChart();

  }

  loadKPIs(): void {
    this.dashboardService.getKpis().subscribe({
      next: (data: Kpi[]) => {
        this.kpis = data;
        // opcional: convertir valores a formato legible
        this.kpis = this.kpis.map(k => ({ ...k, value: this.formatValue(k.value) }));
      },
      error: (err) => {
        console.error('Error fetching KPIs', err);
      }
    });
  }

  private formatValue(v: any): any {
    // Si es número grande, formatear con separador de miles
    if (v == null) return v;
    const n = Number(v);
    if (!isNaN(n)) return n.toLocaleString();
    return v;
  }

}
