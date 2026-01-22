import { Component, inject  } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { ContentMenuComponent } from "../content-menu/content-menu.component";

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, ContentMenuComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {

  router =  inject(Router);
  logout(): void {
    this.router.navigate(['/login']);
    localStorage.removeItem('authToken');
  }
}
