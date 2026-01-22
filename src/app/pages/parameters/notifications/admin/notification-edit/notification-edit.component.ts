import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { HttpClient } from '@angular/common/http';
import { NotificationGatewayService } from '../../../../../core/services/notification-gateway.service';
import {
  NotificationItem,
  NotificationSeverity,
  NotificationChannel,
  RoleSummary,
  UserSummary,
  NotificationUpdatePayload,
  GroupedPermissions
} from '../../../../../shared/models/notification.model';
import { SidebarComponent } from '../../../../sidebar/sidebar.component';
import { NotificationsService } from '../../notifications.service';
import { apiEndpoint } from '../../../../../shared/api-endpoint.util';
import Swal from 'sweetalert2';

interface ModuleOption {
  value: string;
  label: string;
  actions: ActionOption[];
}

interface ActionOption {
  value: string;
  label: string;
  permissionName?: string;
}

@Component({
  selector: 'app-notification-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule, SidebarComponent],
  templateUrl: './notification-edit.component.html',
  styleUrls: ['./notification-edit.component.css']
})
export class NotificationEditComponent implements OnInit {
  notificationId?: number;
  notification?: NotificationItem;
  form!: FormGroup;
  loading = false;
  saving = false;
  error?: string;

  // Catálogos dinámicos desde API de permisos
  moduleOptions: ModuleOption[] = [];
  currentActions: ActionOption[] = [];

  // Catálogos estáticos
  severities: NotificationSeverity[] = ['info', 'warning', 'critical'];
  channels: NotificationChannel[] = ['email', 'push'];
  escalationHoursOptions = [1, 2, 4, 8, 12, 24, 48, 72];
  roles: RoleSummary[] = [];
  users: UserSummary[] = [];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private gateway: NotificationGatewayService,
    private notificationsService: NotificationsService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.notificationId = +id;
      this.loading = true;
      this.initForm();
      this.loadCatalogs();
      // Cargar módulos primero, luego la notificación
      this.loadModulesFromPermissions();
    } else {
      this.router.navigate(['/notifications/list']);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      module: ['', Validators.required],
      action: ['', Validators.required],
      title: ['', [Validators.required, Validators.maxLength(255)]],
      body: [''],
      severity: ['info', Validators.required],
      channels: [['push'], [Validators.required, Validators.minLength(1)]],
      user_ids: [[]],
      role_ids: [[]],
      escalation_enabled: [false],
      escalation_hours: [24],
      requires_blocking: [false],
      active: [true]
    });

    // Escuchar cambios en módulo para actualizar acciones
    this.form.get('module')?.valueChanges.subscribe(moduleValue => {
      this.onModuleChange(moduleValue);
    });
  }

  private loadModulesFromPermissions(): void {
    this.http.get<any>(apiEndpoint('v2/permissions/grouped')).subscribe({
      next: (response) => {
        const grouped: GroupedPermissions = response?.data || {};
        this.moduleOptions = this.parseGroupedPermissions(grouped);

        // Ahora que los módulos están cargados, cargar la notificación
        this.loadNotification();
      },
      error: (err) => {
        console.error('Error cargando permisos agrupados:', err);
        // Fallback a módulos estáticos
        this.moduleOptions = [
          { value: 'users', label: 'Usuarios', actions: [
            { value: 'create', label: 'Crear' },
            { value: 'update', label: 'Actualizar' },
            { value: 'delete', label: 'Eliminar' },
            { value: 'view', label: 'Ver' },
            { value: 'password_reset', label: 'Reset Contraseña' }
          ]},
          { value: 'customers', label: 'Clientes', actions: [
            { value: 'create', label: 'Crear' },
            { value: 'update', label: 'Actualizar' },
            { value: 'delete', label: 'Eliminar' },
            { value: 'view', label: 'Ver' }
          ]},
          { value: 'providers', label: 'Proveedores', actions: [
            { value: 'create', label: 'Crear' },
            { value: 'update', label: 'Actualizar' },
            { value: 'delete', label: 'Eliminar' },
            { value: 'view', label: 'Ver' }
          ]},
          { value: 'inventory', label: 'Inventario', actions: [
            { value: 'create', label: 'Crear' },
            { value: 'update', label: 'Actualizar' },
            { value: 'low_stock', label: 'Stock Bajo' }
          ]},
          { value: 'orders', label: 'Órdenes', actions: [
            { value: 'create', label: 'Crear' },
            { value: 'update', label: 'Actualizar' }
          ]},
          { value: 'system', label: 'Sistema', actions: [
            { value: 'alert', label: 'Alerta' },
            { value: 'test', label: 'Prueba' }
          ]}
        ];

        // Cargar la notificación aunque falle la carga de módulos
        this.loadNotification();
      }
    });
  }

  private parseGroupedPermissions(grouped: GroupedPermissions): ModuleOption[] {
    const modules: ModuleOption[] = [];

    for (const [moduleName, permissions] of Object.entries(grouped)) {
      const actions: ActionOption[] = [];

      for (const perm of permissions) {
        const permName = typeof perm === 'string' ? perm : perm.name;
        // Extraer la acción del nombre del permiso (ej: "companies.view-documents" -> "view-documents")
        const parts = permName.split('.');
        // Tomar todo después del primer punto como acción
        const actionName = parts.length > 1 ? parts.slice(1).join('.') : parts[0];

        // Agregar todas las acciones disponibles (sin filtrar)
        const exists = actions.find(a => a.value === actionName);
        if (!exists) {
          actions.push({
            value: actionName,
            label: this.getActionLabel(actionName),
            permissionName: permName
          });
        }
      }

      if (actions.length > 0) {
        modules.push({
          value: moduleName,
          label: this.getModuleLabel(moduleName),
          actions: actions
        });
      }
    }

    return modules;
  }

  private onModuleChange(moduleValue: string): void {
    const module = this.moduleOptions.find(m => m.value === moduleValue);
    this.currentActions = module?.actions || [];

    // Solo resetear acción si el valor actual no existe en las nuevas opciones
    const currentAction = this.form.get('action')?.value;
    if (currentAction && !this.currentActions.find(a => a.value === currentAction)) {
      this.form.patchValue({ action: '' });
    }
  }

  private loadCatalogs(): void {
    this.notificationsService.fetchRoles().subscribe({
      next: (roles) => {
        this.roles = Array.isArray(roles) ? roles : [];
      },
      error: (err) => {
        console.error('Error cargando roles:', err);
        this.roles = [];
      }
    });

    this.notificationsService.fetchUsers().subscribe({
      next: (users) => {
        this.users = Array.isArray(users) ? users : [];
      },
      error: (err) => {
        console.error('Error cargando usuarios:', err);
        this.users = [];
      }
    });
  }

  loadNotification(): void {
    if (!this.notificationId) return;
    this.error = undefined;

    this.gateway.getById(this.notificationId).subscribe({
      next: (notification) => {
        if (notification) {
          this.notification = notification;

          // Usar 'as any' para acceder a propiedades snake_case del backend
          const notif = notification as any;

          // Primero actualizar las acciones disponibles para el módulo
          if (notif.module) {
            this.onModuleChange(notif.module);
          }

          // Luego mapear los datos del backend al formulario
          const escalationHours = notif.escalation_hours || notif.escalationHours || 0;
          this.form.patchValue({
            module: notif.module || '',
            action: notif.action || '',
            title: notif.title || '',
            body: notif.body || '',
            severity: notif.severity || 'info',
            escalation_enabled: escalationHours > 0,
            escalation_hours: escalationHours > 0 ? escalationHours : 1,
            requires_blocking: notif.requires_blocking || notif.requiresBlocking || false,
            active: notif.active !== false,
            channels: notif.channels || ['push'],
            user_ids: notif.user_ids || notif.userIds || [],
            role_ids: notif.role_ids || notif.roleIds || []
          });

        } else {
          this.error = 'Notificación no encontrada';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar notificación:', err);
        this.error = 'Error al cargar la notificación';
        this.loading = false;
      }
    });
  }

  save(): void {
    if (this.form.invalid || !this.notificationId) {
      this.form.markAllAsTouched();
      Swal.fire({
        icon: 'warning',
        title: 'Formulario inválido',
        text: 'Por favor completa todos los campos requeridos'
      });
      return;
    }

    this.saving = true;
    this.error = undefined;

    const formValue = this.form.value;

    // Si el escalamiento no está habilitado, enviar escalation_hours: 0
    const payload: NotificationUpdatePayload = {
      ...formValue,
      escalation_hours: formValue.escalation_enabled ? formValue.escalation_hours : 0
    };
    // Eliminar el campo escalation_enabled que no existe en el backend
    delete (payload as any).escalation_enabled;

    this.gateway.update(this.notificationId, payload).subscribe({
      next: () => {
        this.saving = false;
        Swal.fire({
          icon: 'success',
          title: 'Actualizado',
          text: 'Notificación actualizada correctamente',
          timer: 1500
        });
        setTimeout(() => this.router.navigate(['/notifications/list']), 1500);
      },
      error: (err) => {
        this.error = err?.error?.message || 'Error al guardar los cambios';
        this.saving = false;
        Swal.fire({ icon: 'error', title: 'Error', text: this.error });
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/notifications/list']);
  }

  delete(): void {
    if (!this.notificationId) return;
    Swal.fire({
      title: '¿Está seguro?',
      text: 'Esta acción eliminará la notificación',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && this.notificationId) {
        this.saving = true;
        this.gateway.delete(this.notificationId).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Eliminada', text: 'Notificación eliminada', timer: 1000 });
            setTimeout(() => this.router.navigate(['/notifications/list']), 1000);
          },
          error: () => {
            this.error = 'Error al eliminar la notificación';
            this.saving = false;
            Swal.fire({ icon: 'error', title: 'Error', text: this.error });
          }
        });
      }
    });
  }

  getModuleLabel(module: string): string {
    const labels: Record<string, string> = {
      users: 'Usuarios',
      customers: 'Clientes',
      providers: 'Proveedores',
      inventory: 'Inventario',
      orders: 'Órdenes',
      system: 'Sistema'
    };
    return labels[module] || module.charAt(0).toUpperCase() + module.slice(1);
  }

  getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      'view': 'Ver',
      'create': 'Crear',
      'edit': 'Editar',
      'update': 'Actualizar',
      'delete': 'Eliminar',
      'view-documents': 'Ver Documentos',
      'addresses.view': 'Ver Direcciones',
      'addresses.create': 'Crear Direcciones',
      'addresses.edit': 'Editar Direcciones',
      'addresses.delete': 'Eliminar Direcciones',
      'contacts.view': 'Ver Contactos',
      'contacts.create': 'Crear Contactos',
      'contacts.edit': 'Editar Contactos',
      'contacts.delete': 'Eliminar Contactos',
      'low_stock': 'Stock Bajo',
      'alert': 'Alerta',
      'test': 'Prueba',
      'password_reset': 'Reset Contraseña'
    };
    // Si no hay etiqueta, formatear el action: "view-documents" -> "View Documents"
    if (labels[action]) {
      return labels[action];
    }
    return action
      .split(/[-.]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getSeverityLabel(severity: string): string {
    const labels: Record<string, string> = {
      info: 'Info',
      warning: 'Advertencia',
      critical: 'Crítico'
    };
    return labels[severity] || severity;
  }

  getChannelLabel(channel: string): string {
    const labels: Record<string, string> = {
      email: 'Email',
      push: 'Push'
    };
    return labels[channel] || channel;
  }

  get destinatariosCount(): number {
    const userCount = this.form.get('user_ids')?.value?.length || 0;
    const roleCount = this.form.get('role_ids')?.value?.length || 0;
    return userCount + roleCount;
  }
}
