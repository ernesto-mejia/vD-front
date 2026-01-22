import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PushNotificationService } from '../../../core/services/push-notification.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-push-notification-prompt',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './push-notification-prompt.component.html',
  styleUrls: ['./push-notification-prompt.component.css']
})
export class PushNotificationPromptComponent implements OnInit {

  showPrompt: boolean = false;
  isSupported: boolean = false;

  constructor(private pushService: PushNotificationService) {}

  async ngOnInit() {
    this.isSupported = this.pushService.isPushSupported();

    if (!this.isSupported) {
      return;
    }

    const permission = this.pushService.getPermissionState();
    const isSubscribed = await this.pushService.isSubscribed();

    // Mostrar el prompt solo si el usuario no ha dado permiso y no está suscrito
    if (permission === 'default' && !isSubscribed) {
      // Esperar 2 segundos antes de mostrar el prompt para no ser intrusivo
      setTimeout(() => {
        this.showPrompt = true;
      }, 2000);
    }
  }

  async allowNotifications() {
    try {
      const permission = await this.pushService.requestPermission();

      if (permission === 'granted') {
        // Suscribir al usuario
        this.pushService.subscribe().subscribe({
          next: () => {
            this.showPrompt = false;
            Swal.fire({
              icon: 'success',
              title: '¡Listo!',
              text: 'Notificaciones push activadas correctamente',
              timer: 3000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            console.error('Error al suscribir:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo activar las notificaciones. Por favor, intenta nuevamente.',
            });
          }
        });
      } else {
        this.showPrompt = false;
      }
    } catch (error: any) {
      console.error('Error al solicitar permiso:', error);
      this.showPrompt = false;
    }
  }

  denyNotifications() {
    this.showPrompt = false;
    // Guardar en localStorage que el usuario rechazó para no molestarlo de nuevo
    localStorage.setItem('push-notifications-denied', 'true');
  }

  dismiss() {
    this.showPrompt = false;
    // Mostrar nuevamente en 7 días
    const nextPromptDate = new Date();
    nextPromptDate.setDate(nextPromptDate.getDate() + 7);
    localStorage.setItem('push-notifications-next-prompt', nextPromptDate.toISOString());
  }
}
