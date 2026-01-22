import { Component, HostListener, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { ContentMenuComponent } from "./pages/content-menu/content-menu.component";
import { SidebarComponent } from "./pages/sidebar/sidebar.component";
import { SharedService } from './servicios/shared.service';
import { SystemBlockerComponent } from './shared/components/system-blocker/system-blocker.component';
import { PushNotificationService } from './core/services/push-notification.service';
import { NotificationToastComponent } from './shared/components/notification-toast/notification-toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HttpClientModule, ContentMenuComponent, SidebarComponent, SystemBlockerComponent, NotificationToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent implements OnInit {
  title = 'EPICA';
  private pushService = inject(PushNotificationService);

  constructor(private sharedService: SharedService) {}

  ngOnInit(): void {
    // Initialize push notifications when app starts
    this.initializePushNotifications();
  }

  private async initializePushNotifications(): Promise<void> {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (token) {
        // Request notification permission and subscribe
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          await this.pushService.subscribeToNotifications();
        }
      }
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  clearLocalStorage(event: Event): void {
    if (!navigator.sendBeacon) {
      this.sharedService.clearAllStorage();
    }
  }
}

