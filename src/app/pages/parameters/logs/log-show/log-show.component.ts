import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../sidebar/sidebar.component';

@Component({
  selector: 'app-log-show',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './log-show.component.html',
  styleUrl: './log-show.component.css'
})
export class LogShowComponent {

}
