import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject, finalize, takeUntil, forkJoin } from 'rxjs';
import { UserService } from '../user.service';
import { NotificationGatewayService } from '../../../../core/services/notification-gateway.service';

@Component({
  selector: 'app-user-view',

  templateUrl: './user-view.component.html',
  styleUrls: ['./user-view.component.css']
})
export class UserViewComponent implements OnInit {
    userId: string = ''; // Almacena el ID del usuario
    roles: any[] = []; // Almacena los roles del usuario
    directPermissions: string[] = []; // Permisos directos del usuario
    effectivePermissions: string[] = []; // Permisos efectivos del usuario
    permissionCategories: any = {}; // Permisos organizados por categoría
    log_accesso: any[] = [];
    user: any = null; // Almacena los datos del usuario
    userStats: any = null; // Estadísticas del usuario
    loadingStats = false; // Indicador de carga de estadísticas
    private destroy$ = new Subject<void>();


  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private readonly userService: UserService,
    private readonly notificationGateway: NotificationGatewayService
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
  }

    private initializeComponent(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (params) => {
          this.userId = params['userId'];
          if (this.userId) {
            this.loadUserData();
          } else {
           // this.handleError('ID de cliente no válido');
          }
        },
        error: (error) => {
          console.error('Error al obtener parámetros de ruta:', error);
         // this.handleError('Error al cargar los datos del cliente');
        }
      });


  }

    loadUserData(): void {
     // this.showLoading();

      this.userService.getUser(+this.userId ).subscribe({
            next: (response: any) => {
              if (response.ok && response.data) {
                this.user = response.data.user;
                this.roles = response.data.roles || [];
                this.directPermissions = response.data.direct_permissions || [];
                this.effectivePermissions = response.data.effective_permissions || [];
                // Organizar permisos por categorías
                this.organizePermissionsByCategory();
                // Cargar estadísticas mock
                this.loadUserStats();
              }
            },
            error: (error) => {
              console.error('Error al cargar los usuarios:', error);
            }
          });
    }

    loadUserStats(): void {
      this.loadingStats = true;
      // Cargar estadísticas reales desde la API
      this.notificationGateway.getUserFullStats(+this.userId, 30)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            if (data) {
              this.userStats = {
                avgResponseTime: data.avg_response_time || 0,
                lastLogin: data.last_login ? new Date(data.last_login) : null,
                lastAction: data.last_action || 'Sin actividad reciente',
                totalNotifications: data.total_notifications || 0,
                viewedCount: data.viewed_count || 0,
                attendedCount: data.attended_count || 0,
                pendingCount: data.pending_count || 0,
                complianceRate: data.compliance_rate || 0,
                hourlyEfficiency: data.hourly_efficiency || 0,
                bySeverity: data.by_severity || {},
                suggestions: data.suggestions || []
              };
            } else {
              // Fallback a datos por defecto si no hay datos
              this.userStats = {
                avgResponseTime: 0,
                lastLogin: null,
                lastAction: 'Sin actividad',
                totalNotifications: 0,
                viewedCount: 0,
                attendedCount: 0,
                pendingCount: 0,
                complianceRate: 0,
                hourlyEfficiency: 0,
                bySeverity: {},
                suggestions: ['No hay suficientes datos para generar sugerencias.']
              };
            }
            this.loadingStats = false;
          },
          error: (error) => {
            console.error('Error al cargar estadísticas de usuario:', error);
            // Fallback a datos vacíos en caso de error
            this.userStats = {
              avgResponseTime: 0,
              lastLogin: null,
              lastAction: 'Error al cargar',
              totalNotifications: 0,
              viewedCount: 0,
              attendedCount: 0,
              pendingCount: 0,
              complianceRate: 0,
              hourlyEfficiency: 0,
              bySeverity: {},
              suggestions: ['Error al cargar sugerencias.']
            };
            this.loadingStats = false;
          }
        });
    }  loadUserlsit(): void {

        this.userService.getUsers().subscribe({
            next: (response) => {
              const users = response.ok && response.data ? response.data : [];

            },
            error: (error) => {
              console.error('Error al cargar los usuarios:', error);
            }
          });
      }

  goBack(): void {
    this.router.navigate(['/users/list']); // Navegar de vuelta a la lista
  }

  editUser(): void {
    if (this.userId) {
      this.router.navigate(['/users/edit', this.userId]); // Navegar a la edición
    } else {
      console.error('No se puede navegar a la edición porque el ID del usuario es inválido.');
    }
  }

  getPermissionSummary(permission: any): string {
    const permissions: string[] = [];
    if (permission.fullright === 1) return 'Acceso Total';
    if (permission.view === 1) permissions.push('Ver');
    if (permission.add === 1) permissions.push('Agregar');
    if (permission.edit === 1) permissions.push('Editar');
    if (permission.delete === 1) permissions.push('Eliminar');
    return permissions.length > 0 ? permissions.join(', ') : 'Sin permisos';
  }

  organizePermissionsByCategory(): void {
    this.permissionCategories = {
      companies: { name: 'Empresas', permissions: [], color: 'primary' },
      addresses: { name: 'Direcciones', permissions: [], color: 'success' },
      contacts: { name: 'Contactos', permissions: [], color: 'info' },
      catalogs: { name: 'Catálogos', permissions: [], color: 'warning' },
      meta: { name: 'Meta', permissions: [], color: 'secondary' },
      equipments: { name: 'Equipos', permissions: [], color: 'dark' },
      brands: { name: 'Marcas', permissions: [], color: 'primary' },
      users: { name: 'Usuarios', permissions: [], color: 'danger' },
      roles: { name: 'Roles', permissions: [], color: 'purple' },
      permissions: { name: 'Permisos', permissions: [], color: 'orange' },
      reports: { name: 'Reportes', permissions: [], color: 'success' }
    };

    // Organizar permisos efectivos por categorías
    this.effectivePermissions.forEach(permission => {
      const category = permission.split('.')[0];
      const action = permission.split('.')[1];

      if (this.permissionCategories[category]) {
        this.permissionCategories[category].permissions.push({
          full: permission,
          action: this.getActionLabel(action),
          actionKey: action
        });
      }
    });

    // Ordenar permisos dentro de cada categoría
    Object.keys(this.permissionCategories).forEach(key => {
      this.permissionCategories[key].permissions.sort((a: any, b: any) =>
        a.action.localeCompare(b.action)
      );
    });
  }

  getActionLabel(action: string): string {
    const actionMap: { [key: string]: string } = {
      'view': 'Ver',
      'create': 'Crear',
      'edit': 'Editar',
      'delete': 'Eliminar',
      'read': 'Leer',
      'export': 'Exportar',
      'manage-roles': 'Gestionar Roles',
      'manage-permissions': 'Gestionar Permisos',
      'view-documents': 'Ver Documentos'
    };
    return actionMap[action] || action;
  }

  getCategoriesWithPermissions(): any[] {
    return Object.keys(this.permissionCategories)
      .filter(key => this.permissionCategories[key].permissions.length > 0)
      .map(key => ({
        key,
        ...this.permissionCategories[key]
      }));
  }



  private tokenKey = 'authToken';  // Clave para almacenar el token
  private getToken(): string | null {
    return localStorage.getItem(this.tokenKey);  // Obtener el token guardado
  }
}
