export interface UsersListResponse {
  ok: boolean;
  data: user[];
  meta?: {
    current_page: number;
    total: number;
    per_page: number;
    last_page: number;
    filters?: any[];
  };
}

export interface user {
  id: number;
  user_name: string;
  email: string;
  // Nuevos campos según respuesta API
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  status: string | null;
  // Compatibilidad con definición anterior
  first_name?: string;
  last_name?: string;
  role?: UserRoles[]; // legado
  // Campos actuales
  roles?: RoleDetail[];
  permissions?: (permission | string | any)[];
}

export interface UserPermissions {
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

 export interface UserRoles {
   id: number;
   name: string;
   guard_name: string;
}

export interface UserViewResponse {
  ok: boolean;
  data: {
    user:user;
  };
}

export interface RolesListResponse {
  success?: boolean;
  data?: DataResponse;
  message?: string;
}

export interface DataResponse {

   current_page?: string;
  data?: RoleDetail[];
  first_page_url?: string;
  from?: number;
  last_page?: number;
}

export interface RoleDetail {
  id?: number;
  name?: string;
  guard_name?: string;
  created_at?: string;
  updated_at?: string;
  permissions?: (permission | string)[];
}

export interface permission {
  id?: number;
  name?: string;
  guard_name?: string;
  created_at?: string;
  updated_at?: string;
}
