import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiEndpoint } from '../../shared/api-endpoint.util';

@Injectable({
  providedIn: 'root'
})
export class OrganizationalStructureService {
  private readonly basePath = 'v2/organizational-structure';

  constructor(private http: HttpClient) {}

  // ==================== ÁREAS ====================

  /**
   * Listar áreas
   */
  getAreas(filters?: AreaFilters): Observable<ApiResponse<Area[]>> {
    let params = new HttpParams();
    if (filters?.active_only) params = params.set('active_only', 'true');
    if (filters?.can_receive_purchases) params = params.set('can_receive_purchases', 'true');
    if (filters?.with_departments) params = params.set('with_departments', 'true');

    return this.http.get<ApiResponse<Area[]>>(apiEndpoint(`${this.basePath}/areas`), { params });
  }

  /**
   * Obtener área por ID
   */
  getArea(id: number): Observable<ApiResponse<Area>> {
    return this.http.get<ApiResponse<Area>>(apiEndpoint(`${this.basePath}/areas/${id}`));
  }

  /**
   * Crear área
   */
  createArea(data: AreaCreateRequest): Observable<ApiResponse<Area>> {
    return this.http.post<ApiResponse<Area>>(apiEndpoint(`${this.basePath}/areas`), data);
  }

  /**
   * Actualizar área
   */
  updateArea(id: number, data: AreaUpdateRequest): Observable<ApiResponse<Area>> {
    return this.http.put<ApiResponse<Area>>(apiEndpoint(`${this.basePath}/areas/${id}`), data);
  }

  /**
   * Eliminar área
   */
  deleteArea(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(apiEndpoint(`${this.basePath}/areas/${id}`));
  }

  /**
   * Obtener estructura jerárquica completa
   */
  getHierarchy(): Observable<ApiResponse<Area[]>> {
    return this.http.get<ApiResponse<Area[]>>(apiEndpoint(`${this.basePath}/areas/hierarchy`));
  }

  /**
   * Obtener áreas con autorizadores
   */
  getAreasWithAuthorizers(): Observable<ApiResponse<Area[]>> {
    return this.http.get<ApiResponse<Area[]>>(apiEndpoint(`${this.basePath}/areas/with-authorizers`));
  }

  // ==================== DEPARTAMENTOS ====================

  /**
   * Listar departamentos
   */
  getDepartments(filters?: DepartmentFilters): Observable<ApiResponse<Department[]>> {
    let params = new HttpParams();
    if (filters?.area_id) params = params.set('area_id', filters.area_id.toString());
    if (filters?.active_only) params = params.set('active_only', 'true');
    if (filters?.can_create_purchases) params = params.set('can_create_purchases', 'true');

    return this.http.get<ApiResponse<Department[]>>(apiEndpoint(`${this.basePath}/departments`), { params });
  }

  /**
   * Obtener departamento por ID
   */
  getDepartment(id: number): Observable<ApiResponse<Department>> {
    return this.http.get<ApiResponse<Department>>(apiEndpoint(`${this.basePath}/departments/${id}`));
  }

  /**
   * Crear departamento
   */
  createDepartment(data: DepartmentCreateRequest): Observable<ApiResponse<Department>> {
    return this.http.post<ApiResponse<Department>>(apiEndpoint(`${this.basePath}/departments`), data);
  }

  /**
   * Actualizar departamento
   */
  updateDepartment(id: number, data: DepartmentUpdateRequest): Observable<ApiResponse<Department>> {
    return this.http.put<ApiResponse<Department>>(apiEndpoint(`${this.basePath}/departments/${id}`), data);
  }

  /**
   * Eliminar departamento
   */
  deleteDepartment(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(apiEndpoint(`${this.basePath}/departments/${id}`));
  }

  /**
   * Obtener departamentos por área
   */
  getDepartmentsByArea(areaId: number): Observable<ApiResponse<Department[]>> {
    return this.http.get<ApiResponse<Department[]>>(apiEndpoint(`${this.basePath}/departments/by-area/${areaId}`));
  }

  // ==================== PUESTOS DE TRABAJO ====================

  /**
   * Listar puestos
   */
  getJobPositions(filters?: JobPositionFilters): Observable<ApiResponse<JobPosition[]>> {
    let params = new HttpParams();
    if (filters?.department_id) params = params.set('department_id', filters.department_id.toString());
    if (filters?.area_id) params = params.set('area_id', filters.area_id.toString());
    if (filters?.active_only) params = params.set('active_only', 'true');
    if (filters?.can_authorize_purchases) params = params.set('can_authorize_purchases', 'true');
    if (filters?.supervisors_only) params = params.set('supervisors_only', 'true');

    return this.http.get<ApiResponse<JobPosition[]>>(apiEndpoint(`${this.basePath}/job-positions`), { params });
  }

  /**
   * Obtener puesto por ID
   */
  getJobPosition(id: number): Observable<ApiResponse<JobPosition>> {
    return this.http.get<ApiResponse<JobPosition>>(apiEndpoint(`${this.basePath}/job-positions/${id}`));
  }

  /**
   * Crear puesto
   */
  createJobPosition(data: JobPositionCreateRequest): Observable<ApiResponse<JobPosition>> {
    return this.http.post<ApiResponse<JobPosition>>(apiEndpoint(`${this.basePath}/job-positions`), data);
  }

  /**
   * Actualizar puesto
   */
  updateJobPosition(id: number, data: JobPositionUpdateRequest): Observable<ApiResponse<JobPosition>> {
    return this.http.put<ApiResponse<JobPosition>>(apiEndpoint(`${this.basePath}/job-positions/${id}`), data);
  }

  /**
   * Eliminar puesto
   */
  deleteJobPosition(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(apiEndpoint(`${this.basePath}/job-positions/${id}`));
  }

  /**
   * Obtener puestos por departamento
   */
  getJobPositionsByDepartment(departmentId: number): Observable<ApiResponse<JobPosition[]>> {
    return this.http.get<ApiResponse<JobPosition[]>>(apiEndpoint(`${this.basePath}/job-positions/by-department/${departmentId}`));
  }

  /**
   * Obtener puestos autorizadores
   */
  getAuthorizerPositions(): Observable<ApiResponse<JobPosition[]>> {
    return this.http.get<ApiResponse<JobPosition[]>>(apiEndpoint(`${this.basePath}/job-positions/authorizers`));
  }

  // ==================== AUTORIZADORES POR ÁREA ====================

  /**
   * Listar autorizadores
   */
  getAreaAuthorizers(filters?: AuthorizerFilters): Observable<ApiResponse<AreaAuthorizer[]>> {
    let params = new HttpParams();
    if (filters?.area_id) params = params.set('area_id', filters.area_id.toString());
    if (filters?.user_id) params = params.set('user_id', filters.user_id.toString());
    if (filters?.authorization_type) params = params.set('authorization_type', filters.authorization_type);

    return this.http.get<ApiResponse<AreaAuthorizer[]>>(apiEndpoint(`${this.basePath}/area-authorizers`), { params });
  }

  /**
   * Obtener autorizador por ID
   */
  getAreaAuthorizer(id: number): Observable<ApiResponse<AreaAuthorizer>> {
    return this.http.get<ApiResponse<AreaAuthorizer>>(apiEndpoint(`${this.basePath}/area-authorizers/${id}`));
  }

  /**
   * Crear autorizador
   */
  createAreaAuthorizer(data: AuthorizerCreateRequest): Observable<ApiResponse<AreaAuthorizer>> {
    return this.http.post<ApiResponse<AreaAuthorizer>>(apiEndpoint(`${this.basePath}/area-authorizers`), data);
  }

  /**
   * Actualizar autorizador
   */
  updateAreaAuthorizer(id: number, data: AuthorizerUpdateRequest): Observable<ApiResponse<AreaAuthorizer>> {
    return this.http.put<ApiResponse<AreaAuthorizer>>(apiEndpoint(`${this.basePath}/area-authorizers/${id}`), data);
  }

  /**
   * Eliminar autorizador
   */
  deleteAreaAuthorizer(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(apiEndpoint(`${this.basePath}/area-authorizers/${id}`));
  }

  /**
   * Obtener autorizadores por área
   */
  getAuthorizersByArea(areaId: number): Observable<ApiResponse<{ area: any; authorizers: AreaAuthorizer[]; grouped: any }>> {
    return this.http.get<ApiResponse<{ area: any; authorizers: AreaAuthorizer[]; grouped: any }>>(
      apiEndpoint(`${this.basePath}/area-authorizers/by-area/${areaId}`)
    );
  }

  /**
   * Verificar si un usuario puede autorizar
   */
  checkUserAuthorization(data: CheckAuthorizationRequest): Observable<ApiResponse<CheckAuthorizationResponse>> {
    return this.http.post<ApiResponse<CheckAuthorizationResponse>>(
      apiEndpoint(`${this.basePath}/area-authorizers/check-authorization`),
      data
    );
  }

  // ==================== VÍNCULOS USUARIO-EMPLEADO ====================

  /**
   * Listar vínculos
   */
  getUserEmployeeLinks(filters?: UserEmployeeLinkFilters): Observable<ApiResponse<UserEmployeeLink[]>> {
    let params = new HttpParams();
    if (filters?.user_id) params = params.set('user_id', filters.user_id.toString());
    if (filters?.employee_id) params = params.set('employee_id', filters.employee_id.toString());
    if (filters?.active_only !== undefined) params = params.set('active_only', filters.active_only.toString());

    return this.http.get<ApiResponse<UserEmployeeLink[]>>(apiEndpoint(`${this.basePath}/user-employee-links`), { params });
  }

  /**
   * Obtener empleado vinculado a un usuario
   */
  getEmployeeByUser(userId: number): Observable<ApiResponse<Employee | null>> {
    return this.http.get<ApiResponse<Employee | null>>(
      apiEndpoint(`${this.basePath}/user-employee-links/employee-by-user/${userId}`)
    );
  }

  /**
   * Obtener usuario vinculado a un empleado
   */
  getUserByEmployee(employeeId: number): Observable<ApiResponse<User | null>> {
    return this.http.get<ApiResponse<User | null>>(
      apiEndpoint(`${this.basePath}/user-employee-links/user-by-employee/${employeeId}`)
    );
  }

  /**
   * Vincular usuario a empleado
   */
  linkUserToEmployee(userId: number, employeeId: number): Observable<ApiResponse<UserEmployeeLink>> {
    return this.http.post<ApiResponse<UserEmployeeLink>>(
      apiEndpoint(`${this.basePath}/user-employee-links/link`),
      { user_id: userId, employee_id: employeeId }
    );
  }

  /**
   * Obtener usuarios sin empleado vinculado
   */
  getUsersWithoutEmployee(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(apiEndpoint(`${this.basePath}/user-employee-links/users-without-employee`));
  }

  /**
   * Obtener todos los usuarios (para selección en autorizadores)
   */
  getUsers(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(apiEndpoint('v2/users'));
  }

  /**
   * Obtener empleados sin usuario vinculado
   */
  getEmployeesWithoutUser(): Observable<ApiResponse<Employee[]>> {
    return this.http.get<ApiResponse<Employee[]>>(apiEndpoint(`${this.basePath}/user-employee-links/employees-without-user`));
  }

  /**
   * Crear vínculo
   */
  createUserEmployeeLink(data: UserEmployeeLinkCreateRequest): Observable<ApiResponse<UserEmployeeLink>> {
    return this.http.post<ApiResponse<UserEmployeeLink>>(apiEndpoint(`${this.basePath}/user-employee-links`), data);
  }

  /**
   * Actualizar vínculo
   */
  updateUserEmployeeLink(id: number, data: UserEmployeeLinkUpdateRequest): Observable<ApiResponse<UserEmployeeLink>> {
    return this.http.put<ApiResponse<UserEmployeeLink>>(apiEndpoint(`${this.basePath}/user-employee-links/${id}`), data);
  }

  /**
   * Eliminar vínculo
   */
  deleteUserEmployeeLink(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(apiEndpoint(`${this.basePath}/user-employee-links/${id}`));
  }
}

// ==================== INTERFACES ====================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: { [key: string]: string[] };
}

// Áreas
export interface Area {
  id: number;
  area: string;
  code: string | null;
  description: string | null;
  is_active: boolean;
  can_receive_purchase_requests: boolean;
  approval_required_for_purchases: boolean;
  display_order: number | null;
  departments?: Department[];
  purchaseAuthorizers?: AreaAuthorizer[];
  created_at: string;
  updated_at: string;
}

export interface AreaFilters {
  active_only?: boolean;
  can_receive_purchases?: boolean;
  with_departments?: boolean;
}

export interface AreaCreateRequest {
  area: string;
  code?: string;
  description?: string;
  is_active?: boolean;
  can_receive_purchase_requests?: boolean;
  approval_required_for_purchases?: boolean;
  display_order?: number;
}

export interface AreaUpdateRequest extends Partial<AreaCreateRequest> {}

// Departamentos
export interface Department {
  id: number;
  area_id: number;
  department: string;
  code: string | null;
  description: string | null;
  budget_center: string | null;
  is_active: boolean;
  can_create_purchase_requests: boolean;
  display_order: number | null;
  area?: Area;
  jobPositions?: JobPosition[];
  created_at: string;
  updated_at: string;
}

export interface DepartmentFilters {
  area_id?: number;
  active_only?: boolean;
  can_create_purchases?: boolean;
}

export interface DepartmentCreateRequest {
  area_id: number;
  department: string;
  code?: string;
  description?: string;
  budget_center?: string;
  is_active?: boolean;
  can_create_purchase_requests?: boolean;
  display_order?: number;
}

export interface DepartmentUpdateRequest extends Partial<DepartmentCreateRequest> {}

// Puestos de trabajo
export interface JobPosition {
  id: number;
  department_id: number;
  job_position: string;
  code: string | null;
  description: string | null;
  level: number | null;
  is_supervisor: boolean;
  is_active: boolean;
  can_authorize_purchases: boolean;
  max_purchase_amount: number | null;
  can_pre_authorize: boolean;
  can_final_authorize: boolean;
  display_order: number | null;
  department?: Department;
  employees?: Employee[];
  created_at: string;
  updated_at: string;
}

export interface JobPositionFilters {
  department_id?: number;
  area_id?: number;
  active_only?: boolean;
  can_authorize_purchases?: boolean;
  supervisors_only?: boolean;
}

export interface JobPositionCreateRequest {
  department_id: number;
  job_position: string;
  code?: string;
  description?: string;
  level?: number;
  is_supervisor?: boolean;
  is_active?: boolean;
  can_authorize_purchases?: boolean;
  max_purchase_amount?: number;
  can_pre_authorize?: boolean;
  can_final_authorize?: boolean;
  display_order?: number;
}

export interface JobPositionUpdateRequest extends Partial<JobPositionCreateRequest> {}

// Autorizadores por área
export interface AreaAuthorizer {
  id: number;
  area_id: number;
  user_id: number;
  authorization_type: 'pre_authorization' | 'final_authorization' | 'both';
  min_amount: number | null;
  max_amount: number | null;
  priority: number;
  is_active: boolean;
  notes: string | null;
  area?: Area;
  user?: User;
  created_at: string;
  updated_at: string;
}

export interface AuthorizerFilters {
  area_id?: number;
  user_id?: number;
  authorization_type?: 'pre_authorization' | 'final_authorization' | 'both';
  active_only?: boolean;
}

export interface AuthorizerCreateRequest {
  area_id: number;
  user_id: number;
  authorization_type: 'pre_authorization' | 'final_authorization' | 'both';
  min_amount?: number;
  max_amount?: number;
  priority?: number;
  is_active?: boolean;
  notes?: string;
}

export interface AuthorizerUpdateRequest extends Partial<AuthorizerCreateRequest> {}

export interface CheckAuthorizationRequest {
  user_id: number;
  area_id: number;
  amount?: number;
  type?: 'pre_authorization' | 'final_authorization';
}

export interface CheckAuthorizationResponse {
  can_authorize: boolean;
  reason?: string;
  authorizations?: AreaAuthorizer[];
}

// Vínculos usuario-empleado
export interface UserEmployeeLink {
  id: number;
  user_id: number;
  employee_id: number;
  is_primary: boolean;
  is_active: boolean;
  notes: string | null;
  user?: User;
  employee?: Employee;
  created_at: string;
  updated_at: string;
}

export interface UserEmployeeLinkFilters {
  user_id?: number;
  employee_id?: number;
  active_only?: boolean;
}

export interface UserEmployeeLinkCreateRequest {
  user_id: number;
  employee_id: number;
  is_primary?: boolean;
  is_active?: boolean;
  notes?: string;
}

export interface UserEmployeeLinkUpdateRequest {
  is_primary?: boolean;
  is_active?: boolean;
  notes?: string;
}

// Empleados (básico)
export interface Employee {
  id: number;
  employee_number: string | null;
  id_area: number;
  id_department: number;
  id_job_position: number;
  status: number;
  area?: Area;
  department?: Department;
  jobPosition?: JobPosition;
}

// Usuarios (básico)
export interface User {
  id: number;
  user_name: string;
  email: string;
  status: number;
}
