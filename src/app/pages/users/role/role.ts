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

export interface permissionsByCategoryResponse {
  success?: boolean;
  data?: {[key: string]: permission[]};
  message?: string;
}

export interface RoleResponse {
  success?: boolean;
  message?: string;
  data?: RoleDetail;
}

export interface permission {
  id?: number;
  name?: string;
  guard_name?: string;
}

export interface RoleResponse {
  success?: boolean;
  message?: string;
  data?: RoleDetail;
}

export interface RoleDetail {
  id?: number;
  name?: string;
  guard_name?: string;
  created_at?: string;
  updated_at?: string;
  permissions?: (permission | string)[];
}

export interface RoleCreateRequest {
  name: string;
  guard_name?: string;
  permissions: string[];
}
