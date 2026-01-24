import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { apiEndpoint } from './shared/api-endpoint.util';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  //private urlMaster = 'http://localhost:8000/api/';  // URL master para API
  private urlMaster = apiEndpoint(''); // URL master para API
  private tokenKey = 'authToken'; // Clave para almacenar el token
  private authStatusKey = 'isAuthenticated'; // Clave para el estado de autenticación

  constructor(private http: HttpClient, private router: Router) {}

  // Método para el login
  login(username: string, password: string): Observable<any> {
    const headers = { 'Content-Type': 'application/json' };
    const credentials = { userName: username, password: password }; // Credenciales para el login con user_name

    // Realiza la solicitud al backend
    return this.http.post(this.urlMaster + 'auth/login', credentials, {
      headers,
    });
  }

  // Método para cerrar sesión
  logout(): void {
    localStorage.removeItem(this.tokenKey); // Eliminar el token
    this.setAuthStatus(false); // Eliminar el estado de autenticación

    this.router.navigate(['login']); // Redirigir al login
  }
  // Método para guardar el token y marcar al usuario como autenticado
  setToken(token: string, user_id: string): void {
    localStorage.setItem(this.tokenKey, token); // Guarda el token
    localStorage.setItem(this.authStatusKey, 'true'); // Marca al usuario como autenticado
    localStorage.setItem('user_id', user_id); // Guarda el id de

    try {
      const payload = JSON.parse(atob(token.split('.')[1])); // Decodificar el payload del token
      localStorage.setItem('user_name', payload.user_name || ''); // Guardar el nombre de usuario
    } catch (error) {
      console.error('Error al decodificar el token:', error);
    }
  }
  // Método para obtener el token del localStorage
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey); // Obtener el token guardado
  }

  // Método para verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    const token = this.getToken(); // Obtener el token almacenado
    if (!token) {
      this.setAuthStatus(false); // Si no hay token, se establece el estado como false
      return false;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1])); // Decodificar el payload del token
      const exp = payload.exp * 1000; // Convertir la fecha de expiración de segundos a milisegundos
      const isExpired = Date.now() >= exp; // Verificar si el token ha expirado
      if (isExpired) {
        this.setAuthStatus(false); // Si el token ha expirado, se establece el estado como false
        localStorage.removeItem(this.tokenKey); // Eliminar el token
        return false;
      }

      return true; // Si el token es válido, la autenticación es verdadera
    } catch (error) {
      console.error('Error al verificar el token:', error); // Agregar un log para depuración
      this.setAuthStatus(false); // Si ocurre un error en la decodificación del token, se marca como no autenticado
      return false;
    }
  }

  // Método para establecer el estado de autenticación en localStorage
  private setAuthStatus(status: boolean): void {
    localStorage.setItem(this.authStatusKey, status ? 'true' : 'false'); // Establecer el estado en localStorage
  }

  // Método para obtener el estado de autenticación
  getAuthStatus(): boolean {
    const authStatus = localStorage.getItem(this.authStatusKey);
    return authStatus === 'true'; // Si el valor en localStorage es 'true', el usuario está autenticado
  }

  // Método para el registro de un nuevo usuario
  register(
    user_name: string,
    password: string,
    name: string,
    last_name: string,
    phone: string,
    email: string,
    role: string,
    status: string,
    permisos: string[]
  ): Observable<any> {
    // Crear el objeto con los datos del nuevo usuario
    const newUser = {
      user_name: user_name,
      password: password,
      name: name,
      last_name: last_name,
      phone: phone,
      email: email,
      role: role,
      status: status,
      permisos: permisos,
    };

    // Enviar la solicitud de registro al backend
    return this.http.post(this.urlMaster + 'user/create', newUser);
  }

  // Método para registrar un nuevo producto
  registerProduct(
    codigo: string,
    codigoSat: string,
    codigoBarras: string,
    descripcion: string,
    tipoInsumo: string,
    presentacion: string,
    numeroPruebas: number,
    estabilidad: string,
    condiciones: string,
    dimensiones: string,
    peso: string,
    proveedor: string,
    equipo: string,
    especialidad: string,
    estudioHom: string,
    prodReemplazo: string,
    nombre: string,
    tipoProductoId: number
  ): Observable<any> {
    // Crear el objeto con los datos del nuevo producto
    const newProduct = {
      codigo: codigo,
      codigoSat: codigoSat,
      codigoBarras: codigoBarras,
      descripcion: descripcion,
      tipoInsumo: tipoInsumo,
      presentacion: presentacion,
      numeroPruebas: numeroPruebas,
      estabilidad: estabilidad,
      condiciones: condiciones,
      dimensiones: dimensiones,
      peso: peso,
      proveedor: proveedor,
      equipo: equipo,
      especialidad: especialidad,
      estudioHom: estudioHom,
      prodReemplazo: prodReemplazo,
      nombre: nombre,
      tipoProductoId: tipoProductoId,
    };

    // Enviar la solicitud de registro al backend
    return this.http.post(this.urlMaster + 'productos/create', newProduct);
  }
  // Método para listado de usuarios
  userList(): Observable<any> {
    return this.http.get(this.urlMaster + 'users-list'); // El interceptor agregará el token automáticamente
  }
  // Método para listado de productos
  productList(): Observable<any> {
    return this.http.get(this.urlMaster + 'productos/viewAllProducto'); // Enviar la solicitud de registro al backend
  }
  // Método para listado de usuarios
  kitList(): Observable<any> {
    return this.http.get(this.urlMaster + 'productos/viewAllProducto'); // Enviar la solicitud de registro al backend
  }

  getUserPermissions(): any {
    const permissions = localStorage.getItem('user_permissions');
    return permissions ? JSON.parse(permissions) : null;
  }

  hasPermission(
    moduleName: string,
    submoduleName: string,
    action: string
  ): boolean {
    const permissions = this.getUserPermissions();
    if (!permissions || !permissions.modules) {
      return false; // Si no hay permisos o módulos, denegar acceso
    }

    const module = permissions.modules.find(
      (mod: any) => mod.module === moduleName
    );
    if (!module) {
      return false; // Si el módulo no existe, denegar acceso
    }

    const submodule = module.submodules.find(
      (sub: any) => sub.submodule === submoduleName
    );
    if (!submodule || !submodule.permissions) {
      return false; // Si el submódulo o permisos no existen, denegar acceso
    }

    return submodule.permissions[action] === 1; // Verificar si la acción está permitida
  }
  getRolUser(id: number): Observable<any> {
      return this.http.get( apiEndpoint(`v2/users/${id}/permissions`) );
    }
}
