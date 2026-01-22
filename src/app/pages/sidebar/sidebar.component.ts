import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentMenuComponent } from "../content-menu/content-menu.component";
import { NotificationsBadgeComponent } from "../parameters/notifications/notifications-badge/notifications-badge.component";

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, ContentMenuComponent, NotificationsBadgeComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  // Estado del menú móvil
  isMenuOpen = false;

  // Toggle del menú móvil
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  // Cerrar menú al seleccionar una opción
  closeMenu(): void {
    this.isMenuOpen = false;
  }

  // Método que maneja el click en los botones
  onButtonClick(buttonName: string): void {
    // Aquí puedes implementar la lógica según el botón clickeado
    // Por ejemplo: navegar a una ruta diferente, cambiar el estado de la app, etc.
  }

}
