import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationAnalyticsComponent } from './notification-analytics/notification-analytics.component';
import { UserNotificationProfileComponent } from './user-notification-profile/user-notification-profile.component';
import { NotificationsAdminListComponent } from './notifications-admin-list/notifications-admin-list.component';
import { SidebarComponent } from '../../../sidebar/sidebar.component';

@Component({
  selector: 'app-notifications-admin',
  standalone: true,
  imports: [CommonModule, NotificationAnalyticsComponent, UserNotificationProfileComponent, NotificationsAdminListComponent, SidebarComponent],
  templateUrl: './notifications-admin.component.html',
  styleUrls: ['./notifications-admin.component.css']
})
export class NotificationsAdminComponent {
  selectedUserId?: number;
  onSelectUser(id: number) { this.selectedUserId = id; }
}
