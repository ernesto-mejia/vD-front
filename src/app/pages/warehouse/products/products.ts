export interface NamedResource {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  sku?: string;
  gtin?: string;
  supplier_catalog_code?: string;
  item_category_id?: number;
  item_status_id?: number;
  brand_id?: number;
  product_type_id?: number;
  business_unit_id?: number;
  specialty_id?: number;
  study_id?: number;
  product_presentation_id?: number;
  presentation_id?: number;
  presentation?: string;
  inventory_unit_of_measurement_id?: number;
  purchase_unit_of_measurement_id?: number;
  unit_equivalence?: number;
  storage_condition_id?: number;
  owner_id?: number;
  configuration?: {
    requires_lot?: boolean;
    requires_expiration_date?: boolean;
    requires_manufacture_date?: boolean;
    requires_invoice?: boolean;
    relates_to_other_products?: boolean;
  };
  physical_spec?: {
    width?: number | null;
    height?: number | null;
    length?: number | null;
    weight?: number | null;
  };
  remplazos?: Array<{
    replacement_item_id?: number | null;
    provider_id?: number | null;
    observations?: string;
    provider_name?: string;
    provider_code?: string;
    provider?: any;
    providers?: any[];
  }>;
  equivalencias?: Array<{
    replacement_item_id?: number | null;
    observations?: string;
    providers?: any[];
  }>;

  status?: NamedResource;
  category?: NamedResource;
  brand?: NamedResource;
  product_type?: NamedResource;
  product_presentation?: NamedResource;
  business_unit?: NamedResource;
  specialty?: NamedResource;
  study?: NamedResource;
  unit_of_measurement?: NamedResource;
  storage_type?: NamedResource;
  storage_condition?: NamedResource;
  inventory_unit_of_measurement?: NamedResource;
  purchase_unit_of_measurement?: NamedResource;
  owner?: NamedResource;

  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface ProductsListResponse {
  ok: boolean;
  data: Product[];
  meta?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}
