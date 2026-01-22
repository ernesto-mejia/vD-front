import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { HttpClient } from '@angular/common/http';
import { NotificationGatewayService } from '../../../../../core/services/notification-gateway.service';
import {
  NotificationModule,
  NotificationAction,
  NotificationSeverity,
  NotificationChannel,
  NotificationType,
  RoleSummary,
  UserSummary,
  NotificationCreatePayload,
  GroupedPermissions
} from '../../../../../shared/models/notification.model';
import Swal from 'sweetalert2';
import { NotificationsService } from '../../notifications.service';
import { SidebarComponent } from "../../../../sidebar/sidebar.component";
import { apiEndpoint } from '../../../../../shared/api-endpoint.util';

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
  selector: 'app-notification-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule, SidebarComponent],
  templateUrl: './notification-create.component.html',
  styleUrls: ['./notification-create.component.css']
})
export class NotificationCreateComponent implements OnInit {
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
  notificationTypes: { value: NotificationType; label: string }[] = [
    { value: 'simple', label: 'Simple (Informativa)' },
    { value: 'authorization', label: 'Autorización (Requiere aprobación)' }
  ];
  escalationHoursOptions = [1, 2, 4, 8, 12, 24];
  roles: RoleSummary[] = [];
  users: UserSummary[] = [];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private gateway: NotificationGatewayService,
    private notificationsService: NotificationsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCatalogs();
    this.loadModulesFromPermissions();
  }

  private initForm(): void {
    this.form = this.fb.group({
      module: ['', Validators.required],
      action: ['', Validators.required],
      type: ['simple', Validators.required],
      title: ['', [Validators.required, Validators.maxLength(255)]],
      body: [''],
      severity: ['info', Validators.required],
      channels: [['push'], [Validators.required, Validators.minLength(1)]],
      user_ids: [[]],
      role_ids: [[]],
      escalation_enabled: [false],
      escalation_hours: [1],
      requires_blocking: [false],
      active: [true],
      // Authorization fields
      authorizable_type: [''],
      authorizable_id: [null],
      authorization_field: [''],
      approve_value: [''],
      reject_value: ['']
    });

    // Escuchar cambios en módulo para actualizar acciones
    this.form.get('module')?.valueChanges.subscribe(moduleValue => {
      this.onModuleChange(moduleValue);
    });

    // Escuchar cambios en type para validar campos de autorización
    this.form.get('type')?.valueChanges.subscribe(typeValue => {
      this.onTypeChange(typeValue);
    });
  }

  private onTypeChange(type: NotificationType): void {
    const authFields = ['authorizable_type', 'authorization_field', 'approve_value', 'reject_value'];

    if (type === 'authorization') {
      // Hacer campos de autorización requeridos
      authFields.forEach(field => {
        this.form.get(field)?.setValidators([Validators.required]);
        this.form.get(field)?.updateValueAndValidity();
      });
      // Cambiar acción a 'authorize' si está disponible
      if (this.currentActions.find(a => a.value === 'authorize')) {
        this.form.patchValue({ action: 'authorize' });
      }
    } else {
      // Quitar validación de campos de autorización
      authFields.forEach(field => {
        this.form.get(field)?.clearValidators();
        this.form.get(field)?.updateValueAndValidity();
      });
    }
  }

  get isAuthorizationType(): boolean {
    return this.form.get('type')?.value === 'authorization';
  }

  private loadModulesFromPermissions(): void {
    this.http.get<any>(apiEndpoint('v2/permissions/grouped')).subscribe({
      next: (response) => {
        const grouped: GroupedPermissions = response?.data || {};
        this.moduleOptions = this.parseGroupedPermissions(grouped);
      },
      error: (err) => {
        console.error('Error cargando permisos agrupados:', err);
        // Fallback a módulos estáticos
        this.moduleOptions = [
          { value: 'users', label: 'Usuarios', actions: [
            { value: 'create', label: 'Crear' },
            { value: 'update', label: 'Actualizar' },
            { value: 'delete', label: 'Eliminar' }
          ]},
          { value: 'customers', label: 'Clientes', actions: [
            { value: 'create', label: 'Crear' },
            { value: 'update', label: 'Actualizar' },
            { value: 'delete', label: 'Eliminar' }
          ]},
          { value: 'providers', label: 'Proveedores', actions: [
            { value: 'create', label: 'Crear' },
            { value: 'update', label: 'Actualizar' },
            { value: 'delete', label: 'Eliminar' }
          ]}
        ];
      }
    });
  }

  private parseGroupedPermissions(grouped: GroupedPermissions): ModuleOption[] {
    const modules: ModuleOption[] = [];

    for (const [moduleName, permissions] of Object.entries(grouped)) {
      const actions: ActionOption[] = [];

      for (const perm of permissions) {
        // Handle both string and object permissions
        const permName = typeof perm === 'string' ? perm : perm.name;

        // Extraer la acción del nombre del permiso (ej: "companies.view-documents" -> "view-documents")
        const parts = permName.split('.');
        // Tomar todo después del primer punto como acción (ej: "clients.addresses.view" -> "addresses.view")
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

    // Resetear acción seleccionada
    this.form.patchValue({ action: '' });
  }

  private loadCatalogs(): void {
    this.loading = true;

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
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando usuarios:', err);
        this.users = [];
        this.loading = false;
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
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
    const payload: NotificationCreatePayload = {
      ...formValue,
      escalation_hours: formValue.escalation_enabled ? formValue.escalation_hours : 0
    };
    // Eliminar el campo escalation_enabled que no existe en el backend
    delete (payload as any).escalation_enabled;

    // Si no es autorización, limpiar campos de autorización
    if (formValue.type !== 'authorization') {
      delete payload.authorizable_type;
      delete payload.authorizable_id;
      delete payload.authorization_field;
      delete payload.approve_value;
      delete payload.reject_value;
    }

    this.notificationsService.create(payload).subscribe({
      next: (notification) => {

        this.saving = false;
        Swal.fire({
          icon: 'success',
          title: 'Plantilla creada',
          text: 'La plantilla de notificación se creó exitosamente',
          timer: 1500
        });
        setTimeout(() => {
          this.router.navigate(['/notifications/list']);
        }, 1500);
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.message || 'Error al crear la notificación';
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: this.error
        });
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/notifications/list']);
  }

  getModuleLabel(module: string): string {
    const labels: Record<string, string> = {
      users: 'Usuarios',
      customers: 'Clientes',
      providers: 'Proveedores'
    };
    return labels[module] || module;
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
