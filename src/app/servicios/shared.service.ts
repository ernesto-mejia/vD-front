  import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Subject } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiEndpoint } from '../shared/api-endpoint.util';



  @Injectable({
    providedIn: 'root'
  })
  export class SharedService {

    constructor(private http: HttpClient) {}

    clearActiveTab(): void {
      localStorage.removeItem('activeTab');
      localStorage.removeItem('activeSection');
      localStorage.removeItem('activeSubSection');
    }

    clearAllStorage(): void {
      localStorage.clear();
    }

    private userNameSource = new BehaviorSubject<string | null>(localStorage.getItem('user_name'));
    userName$ = this.userNameSource.asObservable();

    updateUserName(userName: string): void {
      this.userNameSource.next(userName);
      localStorage.setItem('user_name', userName);
    }

    private permissions: any = null;
    private permissionsSubject = new Subject<void>();
    private permissionsCache: { [userId: string]: any } = {};
    private cacheExpiry: { [userId: string]: number } = {};
    private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

    get permissions$() {
      return this.permissionsSubject.asObservable();
    }

    getRole(): string {
      const userId = this.getCurrentUserId();
      if (!userId) return '';

      const cacheKey = userId.toString();
      const permissions = this.permissionsCache[cacheKey];

      if (permissions && permissions.roles && permissions.roles.length > 0) {
        // Retornar el primer rol (generalmente el principal)
        return permissions.roles[0].name;
      }

      // Fallback al método anterior
      return this.permissions?.role || '';
    }

    // Método para verificar si el usuario es super-admin
    isSuperAdmin(): boolean {
      // Función auxiliar para verificar si un nombre de rol es super-admin
      const isSuperAdminRole = (roleName: string): boolean => {
        const normalizedName = roleName.toLowerCase().replace(/[\s_-]/g, '');
        return normalizedName === 'superadmin';
      };

      // Método 1: Intentar con cache nuevo
      const userId = this.getCurrentUserId();
      if (userId) {
        const cacheKey = userId.toString();
        const permissions = this.permissionsCache[cacheKey];

        if (permissions && permissions.roles &&
           permissions.roles.some((role: any) => isSuperAdminRole(role.name))) {
          return true;
        }
      }

      // Método 2: Fallback con localStorage directo
      const userPermissions = localStorage.getItem('user_permissions');
      if (userPermissions) {
        try {
          const permissions = JSON.parse(userPermissions);
          if (permissions.roles && permissions.roles.some((role: any) => isSuperAdminRole(role.name))) {
            return true;
          }
        } catch (error) {
          console.error('Error al parsear permisos de usuario:', error);
        }
      }

      return false;
    }

    // Método para obtener todos los roles del usuario
    getUserRoles(): string[] {
      const userId = this.getCurrentUserId();
      if (!userId) return [];

      const cacheKey = userId.toString();
      const permissions = this.permissionsCache[cacheKey];

      if (permissions && permissions.roles) {
        return permissions.roles.map((role: any) => role.name);
      }

      return [];
    }

    reloadPermissions(): void {
      const userId = this.getCurrentUserId();

      // Primero cargar desde localStorage al cache (sincrónico)
      const localData = localStorage.getItem('user_permissions');
      if (localData && userId) {
        try {
          const permissions = JSON.parse(localData);
          const cacheKey = userId.toString();
          this.permissionsCache[cacheKey] = permissions;
          this.cacheExpiry[cacheKey] = Date.now() + this.CACHE_DURATION;
        } catch (error) {
          console.error('Error al parsear permisos de localStorage:', error);
        }
      }

      // Notificar a los suscriptores que los permisos se actualizaron
      this.permissionsSubject.next();

      // Opcionalmente, recargar desde el API en segundo plano
      if (userId) {
        this.loadUserPermissionsAsync(userId).subscribe({
          next: (response) => {
            if (response.ok && response.data) {
              const cacheKey = userId.toString();
              this.permissionsCache[cacheKey] = response.data;
              this.cacheExpiry[cacheKey] = Date.now() + this.CACHE_DURATION;
              // Actualizar también localStorage
              localStorage.setItem('user_permissions', JSON.stringify(response.data));
              this.permissionsSubject.next();
            }
          },
          error: (error) => {
            console.error('Error al recargar permisos desde API:', error);
          }
        });
      }
    }

    hasPermission(module: string, submodule: string, permission: string): boolean {
      try {
        // Primero, intentar verificar si es super-admin usando el método directo
        if (this.isSuperAdmin()) {
          return true;
        }

        // Fallback: verificar permisos en localStorage directamente
        const userPermissions = localStorage.getItem('user_permissions');
        if (userPermissions) {
          const permissions = JSON.parse(userPermissions);

          // Si tiene roles y es super-admin, permitir acceso
          if (permissions.roles && permissions.roles.some((role: any) => role.name === 'super-admin')) {
            return true;
          }

          // Si tiene effective_permissions, verificar permiso específico
          if (permissions.effective_permissions) {
            let fullPermission: string;
            if (submodule && submodule.trim() !== '') {
              fullPermission = `${module}.${submodule}.${permission}`;
            } else {
              fullPermission = `${module}.${permission}`;
            }
            return permissions.effective_permissions.includes(fullPermission);
          }

          // Fallback adicional para estructura de permisos antigua
          if (permissions.modules) {
            const moduleObj = permissions.modules.find((mod: any) => mod.module === module);
            if (!moduleObj) return false;

            const submoduleObj = moduleObj.submodules.find((sub: any) => sub.submodule === submodule);
            if (!submoduleObj || !submoduleObj.permissions) return false;

            return submoduleObj.permissions[permission] === 1;
          }
        }

        // Obtener el ID del usuario actual para método nuevo
        const userId = this.getCurrentUserId();

        if (!userId) {
          console.warn('[hasPermission] No se pudo obtener el ID del usuario');
          return false;
        }

        // Verificar si tenemos permisos en cache y si no han expirado
        const cacheKey = userId.toString();
        const now = Date.now();


        if (this.permissionsCache[cacheKey] && this.cacheExpiry[cacheKey] > now) {
          const result = this.checkPermissionInCache(module, submodule, permission, cacheKey);
          return result;
        }
        this.loadUserPermissionsSync(userId);
        const result = this.checkPermissionInCache(module, submodule, permission, cacheKey);
        return result;

      } catch (error) {
        console.error('Error al verificar permisos:', error);
        return false;
      }
    }


    hasAnyPermissionInModule(module: string): boolean {
      // Si es super-admin, tiene acceso a todo
      if (this.isSuperAdmin()) {
        return true;
      }

      const userId = this.getCurrentUserId();
      if (!userId) return false;

      const cacheKey = userId.toString();
      let permissions = this.permissionsCache[cacheKey];

      // Fallback a localStorage si no hay cache
      if (!permissions || !permissions.effective_permissions) {
        const userPermissions = localStorage.getItem('user_permissions');
        if (userPermissions) {
          try {
            permissions = JSON.parse(userPermissions);
          } catch (error) {
            console.error('Error al parsear permisos de usuario:', error);
            return false;
          }
        } else {
          return false;
        }
      }

      if (!permissions.effective_permissions) return false;

      return permissions.effective_permissions.some((perm: string) => perm.startsWith(`${module}.`));
    }

    hasAnyPermissionInSubmodule(module: string, submodule: string): boolean {
      // Si es super-admin, tiene acceso a todo
      if (this.isSuperAdmin()) {
        return true;
      }

      const userId = this.getCurrentUserId();
      if (!userId) return false;

      const cacheKey = userId.toString();
      let permissions = this.permissionsCache[cacheKey];

      // Fallback a localStorage si no hay cache
      if (!permissions || !permissions.effective_permissions) {
        const userPermissions = localStorage.getItem('user_permissions');
        if (userPermissions) {
          try {
            permissions = JSON.parse(userPermissions);
          } catch (error) {
            console.error('Error al parsear permisos de usuario:', error);
            return false;
          }
        } else {
          return false;
        }
      }

      if (!permissions.effective_permissions) return false;

      // Si el submódulo está vacío, buscar permisos que empiecen con 'module.'
      if (!submodule || submodule.trim() === '') {
        return permissions.effective_permissions.some((perm: string) => perm.startsWith(`${module}.`));
      }

      // Buscar permisos que empiecen con 'module.submodule.' O sean exactamente 'module.submodule'
      const exactPermission = `${module}.${submodule}`;
      return permissions.effective_permissions.some((perm: string) =>
        perm === exactPermission || perm.startsWith(`${exactPermission}.`)
      );
    }

    // Métodos auxiliares
    getCurrentUserId(): number | null {
      try {
        // Primero intentar obtener directamente de localStorage
        const userId = localStorage.getItem('user_id');
        if (userId) {
          return Number(userId);
        }

        // Fallback: intentar obtener de user_permissions o userData
        const userDataString = localStorage.getItem('user_permissions') || localStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          if (userData.user?.id) return userData.user.id;
          if (userData.id) return userData.id;
        }

        // Fallback: intentar obtener del token JWT
        const token = localStorage.getItem('authToken');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          return payload.sub || payload.user_id || null;
        }

        return null;
      } catch (error) {
        console.error('Error al obtener ID de usuario:', error);
        return null;
      }
    }

    private checkPermissionInCache(module: string, submodule: string, permission: string, cacheKey: string): boolean {
      const permissions = this.permissionsCache[cacheKey];

      if (!permissions || !permissions.effective_permissions) {
        return false;
      }

      // Verificar si es super-admin
      if (permissions.roles && permissions.roles.some((role: any) => role.name === 'super-admin')) {
        return true; // Super admin tiene todos los permisos
      }

      // Construir el permiso completo
      let fullPermission: string;
      if (submodule && submodule.trim() !== '') {
        fullPermission = `${module}.${submodule}.${permission}`;
      } else {
        fullPermission = `${module}.${permission}`;
      }

      // Buscar en effective_permissions
      const result = permissions.effective_permissions.includes(fullPermission);
      return result;
    }

    private loadUserPermissionsSync(userId: number): void {
      try {
        const xhr = new XMLHttpRequest();
        const token = localStorage.getItem('authToken');
        const url = apiEndpoint(`/v2/users/${userId}/permissions`);

        xhr.open('GET', url, false); // Llamada síncrona
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              const response = JSON.parse(xhr.responseText);
              if (response.ok && response.data) {
                const cacheKey = userId.toString();
                this.permissionsCache[cacheKey] = response.data;
                this.cacheExpiry[cacheKey] = Date.now() + this.CACHE_DURATION;
              }
            } else {
              console.error('Error al cargar permisos del usuario:', xhr.status, xhr.statusText);
            }
          }
        };

        xhr.send();
      } catch (error) {
        console.error('Error en llamada síncrona de permisos:', error);
      }
    }

    // Método asíncrono para cargar permisos (recomendado para uso futuro)
    loadUserPermissionsAsync(userId: number): Observable<any> {
      const token = localStorage.getItem('authToken');
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      return this.http.get(apiEndpoint(`/v2/users/${userId}/permissions`), { headers });
    }

    // Método para limpiar cache de permisos
    clearPermissionsCache(userId?: number): void {
      if (userId) {
        const cacheKey = userId.toString();
        delete this.permissionsCache[cacheKey];
        delete this.cacheExpiry[cacheKey];
      } else {
        this.permissionsCache = {};
        this.cacheExpiry = {};
      }
    }

    resetPermissions(): void {
      this.permissions = null;
      this.clearPermissionsCache(); // Limpiar cache también
      this.permissionsSubject.next();
    }

    // Método para diagnosticar problemas de permisos
    debugPermissions(): any {
      const userId = this.getCurrentUserId();
      const userPermissions = localStorage.getItem('user_permissions');
      const authToken = localStorage.getItem('authToken');
      const isSuperAdmin = this.isSuperAdmin();

      return {
        userId,
        isSuperAdmin,
        hasUserPermissions: !!userPermissions,
        hasAuthToken: !!authToken,
        userPermissionsData: userPermissions ? JSON.parse(userPermissions) : null,
        cacheKeys: Object.keys(this.permissionsCache),
        timestamp: new Date().toISOString()
      };
    }
  }
