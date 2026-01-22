import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap, startWith } from 'rxjs/operators';
import { NotificationGatewayService } from '../../../../core/services/notification-gateway.service';
import { PushRealtimeService } from '../../../../core/services/push-realtime.service';

@Component({
  selector: 'app-notifications-badge',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './notifications-badge.component.html',
  styleUrls: ['./notifications-badge.component.css']
})
export class NotificationsBadgeComponent implements OnInit, OnDestroy {
  count = 0;
  animateBell = false;
  animateBadge = false;
  private destroy$ = new Subject<void>();
  private refreshInterval = 5000; // Actualizar cada 5 segundos para tiempo real
  private lastCount = 0;

  constructor(
    private gateway: NotificationGatewayService,
    private pushRealtime: PushRealtimeService
  ) {}

  ngOnInit(): void {

    // Iniciar escucha de notificaciones push (Service Worker)
    this.pushRealtime.startListening();

    // Suscribirse al contador de no leídas
    this.gateway.unread().pipe(
      takeUntil(this.destroy$)
    ).subscribe(currentCount => {
      // Detectar si hay nuevas notificaciones (cuando el count aumenta)
      if (currentCount > this.lastCount) {
        this.triggerAnimation();
        // Emitir evento para mostrar toast
        this.pushRealtime.emitNewNotification(currentCount - this.lastCount);
      }
      this.lastCount = currentCount;
      this.count = currentCount;
    });

    // Cargar inicialmente y luego cada intervalo (polling rápido)
    interval(this.refreshInterval).pipe(
      startWith(0),
      switchMap(() => this.gateway.loadUnreadCount()),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refresh(): void {
    this.gateway.loadUnreadCount().subscribe();
  }

  private triggerAnimation(): void {
    // Activar animaciones
    this.animateBell = true;
    this.animateBadge = true;

    // Desactivar después de la animación
    setTimeout(() => {
      this.animateBell = false;
      this.animateBadge = false;
    }, 1000);
  }
}
