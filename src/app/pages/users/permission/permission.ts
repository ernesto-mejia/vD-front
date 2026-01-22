export interface PermissionsListResponse {
  success?: boolean;
  data?: DataResponse;
  message?: string;
}

export interface DataResponse {
  current_page?: string;
  data?: PermissionDetail[];
  first_page_url?: string;
  from?: number;
  last_page?: number;
}

export interface PermissionResponse {
  success?: boolean;
  message?: string;
  data?: PermissionDetail;
}

export interface PermissionDetail {
  id?: number;
  name?: string;
  guard_name?: string;
  created_at?: string;
  updated_at?: string;
}
