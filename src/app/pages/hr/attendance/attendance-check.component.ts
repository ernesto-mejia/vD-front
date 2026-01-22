import { Component, OnInit, OnDestroy, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HumanResourcesService } from '../../../servicios/human-resources.service';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import Swal from 'sweetalert2';

interface WorkLocation {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
}

@Component({
  selector: 'app-attendance-check',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  templateUrl: './attendance-check.component.html',
  styleUrls: ['./attendance-check.component.css']
})
export class AttendanceCheckComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  private hrService = inject(HumanResourcesService);
  private mediaStream: MediaStream | null = null;
  private clockInterval: any;

  // Estado UI
  currentTime = '';
  currentDate = new Date();
  todayRecord: any = null;
  recentRecords: any[] = [];
  notes = '';
  loading = false;
  successMessage = '';
  errorMessage = '';

  // Estado de ubicación
  currentLocation: { latitude: number; longitude: number } | null = null;
  locationLoading = false;
  locationError = '';
  availableLocations: WorkLocation[] = [];
  matchedLocation: WorkLocation | null = null;
  selectedLocationId: number | null = null;
  locationValidated = false;

  // Estado de cámara
  cameraActive = false;
  cameraError = '';
  capturedPhoto: string | null = null;
  showCamera = false;

  // Paso actual del proceso
  currentStep: 'start' | 'location' | 'photo' | 'confirm' = 'start';
  checkType: 'in' | 'out' = 'in';

  ngOnInit() {
    this.updateTime();
    this.clockInterval = setInterval(() => this.updateTime(), 1000);
    this.loadTodayRecord();
    this.loadRecentRecords();
    this.loadWorkLocations();
  }

  ngOnDestroy() {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
    this.stopCamera();
  }

  updateTime() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.currentDate = now;
  }

  loadTodayRecord() {
    this.loading = true;
    const today = new Date().toISOString().split('T')[0];
    this.hrService.getAttendanceRecords({ start_date: today, end_date: today }).subscribe({
      next: (res) => {
        const records = res.data?.data || res.data || [];
        this.todayRecord = records[0] || null;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadRecentRecords() {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    this.hrService.getAttendanceRecords({
      start_date: weekAgo.toISOString().split('T')[0],
      end_date: today.toISOString().split('T')[0]
    }).subscribe({
      next: (res) => {
        this.recentRecords = (res.data?.data || res.data || []).slice(0, 5);
      }
    });
  }

  loadWorkLocations() {
    this.hrService.getWorkLocations().subscribe({
      next: (res) => {
        this.availableLocations = res.data || [];
      },
      error: () => {
        // Si no hay endpoint, usar ubicación por defecto
        this.availableLocations = [];
      }
    });
  }

  // =================== FLUJO DE REGISTRO ===================

  startCheckIn() {
    this.checkType = 'in';
    this.currentStep = 'location';
    this.requestLocation();
  }

  startCheckOut() {
    this.checkType = 'out';
    this.currentStep = 'location';
    this.requestLocation();
  }

  cancelProcess() {
    this.currentStep = 'start';
    this.capturedPhoto = null;
    this.currentLocation = null;
    this.matchedLocation = null;
    this.selectedLocationId = null;
    this.locationValidated = false;
    this.stopCamera();
  }

  // =================== UBICACIÓN ===================

  requestLocation() {
    this.locationLoading = true;
    this.locationError = '';

    if (!navigator.geolocation) {
      this.locationError = 'La geolocalización no está soportada en este navegador';
      this.locationLoading = false;
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.currentLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        this.locationLoading = false;
        this.validateLocationWithSavedAddresses();
      },
      (error) => {
        this.locationLoading = false;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            this.locationError = 'Se denegó el permiso de ubicación. Por favor habilite la ubicación.';
            break;
          case error.POSITION_UNAVAILABLE:
            this.locationError = 'La ubicación no está disponible.';
            break;
          case error.TIMEOUT:
            this.locationError = 'Tiempo de espera agotado al obtener la ubicación.';
            break;
          default:
            this.locationError = 'Error al obtener la ubicación.';
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  validateLocationWithSavedAddresses() {
    if (!this.currentLocation) return;

    // Buscar si coincide con alguna ubicación guardada
    for (const loc of this.availableLocations) {
      const distance = this.calculateDistance(
        this.currentLocation.latitude,
        this.currentLocation.longitude,
        loc.latitude,
        loc.longitude
      );

      if (distance <= loc.radius_meters) {
        this.matchedLocation = loc;
        this.selectedLocationId = loc.id;
        this.locationValidated = true;
        break;
      }
    }

    // Si no hay ubicaciones guardadas o no coincide, permitir selección manual
    if (!this.matchedLocation && this.availableLocations.length > 0) {
      // Mostrar selector de ubicación
      this.locationValidated = false;
    } else if (this.availableLocations.length === 0) {
      // Si no hay ubicaciones configuradas, continuar sin validación
      this.locationValidated = true;
    }
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(value: number): number {
    return value * Math.PI / 180;
  }

  selectLocation(locationId: number) {
    this.selectedLocationId = locationId;
    const selected = this.availableLocations.find(l => l.id === locationId);
    if (selected) {
      this.matchedLocation = selected;
    }
  }

  confirmLocation() {
    if (!this.selectedLocationId && this.availableLocations.length > 0) {
      Swal.fire('Atención', 'Por favor seleccione la sede donde se encuentra', 'warning');
      return;
    }
    this.locationValidated = true;
    this.currentStep = 'photo';
    this.initCamera();
  }

  // =================== CÁMARA ===================

  async initCamera() {
    this.cameraError = '';
    this.showCamera = true;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      // Esperar a que el ViewChild esté disponible
      setTimeout(() => {
        if (this.videoElement?.nativeElement) {
          this.videoElement.nativeElement.srcObject = this.mediaStream;
          this.cameraActive = true;
        }
      }, 100);
    } catch (error: any) {
      this.cameraError = 'No se pudo acceder a la cámara. Por favor permita el acceso.';
      console.error('Camera error:', error);
    }
  }

  capturePhoto() {
    if (!this.videoElement?.nativeElement || !this.canvasElement?.nativeElement) return;

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    // Convertir a base64
    this.capturedPhoto = canvas.toDataURL('image/jpeg', 0.8);
    this.stopCamera();
    this.currentStep = 'confirm';
  }

  retakePhoto() {
    this.capturedPhoto = null;
    this.currentStep = 'photo';
    this.initCamera();
  }

  stopCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.cameraActive = false;
    this.showCamera = false;
  }

  // =================== CONFIRMAR Y ENVIAR ===================

  confirmAttendance() {
    this.loading = true;
    this.errorMessage = '';

    const attendanceData = {
      notes: this.notes,
      photo: this.capturedPhoto,
      latitude: this.currentLocation?.latitude,
      longitude: this.currentLocation?.longitude,
      work_location_id: this.selectedLocationId
    };

    const observable = this.checkType === 'in'
      ? this.hrService.checkIn(attendanceData)
      : this.hrService.checkOut(attendanceData);

    observable.subscribe({
      next: () => {
        const action = this.checkType === 'in' ? 'Entrada' : 'Salida';
        Swal.fire({
          icon: 'success',
          title: `¡${action} registrada!`,
          text: `Tu ${action.toLowerCase()} ha sido registrada correctamente`,
          timer: 3000,
          showConfirmButton: false
        });
        this.cancelProcess();
        this.loadTodayRecord();
        this.loadRecentRecords();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Error al registrar asistencia';
        Swal.fire('Error', this.errorMessage, 'error');
      }
    });
  }

  // Helpers para template
  get canCheckIn(): boolean {
    return !this.todayRecord?.check_in;
  }

  get canCheckOut(): boolean {
    return this.todayRecord?.check_in && !this.todayRecord?.check_out;
  }
}
