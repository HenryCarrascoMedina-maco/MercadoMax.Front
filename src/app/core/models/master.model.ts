// ── Product Category ─────────────────────────────────────
export interface ProductCategoryResponse {
  id: number;
  name: string;
  description: string;
  status: boolean;
  createdAt: string;
}

export interface CreateProductCategoryRequest {
  name: string;
  description?: string;
}

export interface UpdateProductCategoryRequest {
  id: number;
  name: string;
  description?: string;
  status: boolean;
}

// ── Product ─────────────────────────────────────────────
export interface ProductResponse {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
  description: string;
  status: boolean;
  createdAt: string;
}

export interface CreateProductRequest {
  name: string;
  categoryId: number;
  description?: string;
}

export interface UpdateProductRequest {
  id: number;
  name: string;
  categoryId: number;
  description?: string;
  status: boolean;
}

// ── Product Size ────────────────────────────────────────
export interface ProductSizeResponse {
  id: number;
  name: string;
  productId: number;
  productName: string;
  status: boolean;
  createdAt: string;
}

export interface CreateProductSizeRequest {
  name: string;
  productId: number;
}

export interface UpdateProductSizeRequest {
  id: number;
  name: string;
  productId: number;
  status: boolean;
}

// ── Brand ───────────────────────────────────────────────
export interface BrandResponse {
  id: number;
  name: string;
  supplierId: number;
  supplierName: string;
  productId: number;
  productName: string;
  status: boolean;
  createdAt: string;
}

export interface CreateBrandRequest {
  name: string;
  supplierId: number;
  productId: number;
}

export interface UpdateBrandRequest {
  id: number;
  name: string;
  supplierId: number;
  productId: number;
  status: boolean;
}

// ── Supplier ────────────────────────────────────────────
export interface SupplierResponse {
  id: number;
  businessName: string;
  taxId: string;
  phone: string;
  address: string;
  province: string;
  department: string;
  contactName: string;
  contactPhone: string;
  userId: number | null;
  status: boolean;
  createdAt: string;
}

export interface CreateSupplierRequest {
  businessName: string;
  taxId: string;
  phone?: string;
  address?: string;
  province?: string;
  department?: string;
  contactName?: string;
  contactPhone?: string;
  userId?: number;
}

export interface UpdateSupplierRequest {
  id: number;
  businessName: string;
  taxId: string;
  phone?: string;
  address?: string;
  province?: string;
  department?: string;
  contactName?: string;
  contactPhone?: string;
  userId?: number;
  status: boolean;
}

// ── Logistic Unit ───────────────────────────────────────
export interface LogisticUnitResponse {
  id: number;
  name: string;
  abbreviation: string;
  /** Peso estimado de un bulto, en kg. Null mientras no se defina. */
  weightKg: number | null;
  status: boolean;
  createdAt: string;
}

export interface CreateLogisticUnitRequest {
  name: string;
  abbreviation: string;
  weightKg?: number | null;
}

export interface UpdateLogisticUnitRequest {
  id: number;
  name: string;
  abbreviation: string;
  weightKg?: number | null;
  status: boolean;
}

// ── Pavilion ────────────────────────────────────────────
export interface PavilionResponse {
  id: number;
  name: string;
  category: string;
  location: string;
  status: boolean;
  createdAt: string;
}

export interface CreatePavilionRequest {
  name: string;
  category?: string;
  location?: string;
}

export interface UpdatePavilionRequest {
  id: number;
  name: string;
  category?: string;
  location?: string;
  status: boolean;
}

// ── Stall ───────────────────────────────────────────────
export interface StallResponse {
  id: number;
  number: string;
  pavilionId: number;
  pavilionName: string;
  userId: number | null;
  ownerName: string;
  status: boolean;
  createdAt: string;
}

export interface CreateStallRequest {
  number: string;
  pavilionId: number;
  /** null deja el puesto sin propietario (SP_*_STALL asigna UserId tal cual llega). */
  userId?: number | null;
}

export interface UpdateStallRequest {
  id: number;
  number: string;
  pavilionId: number;
  /** null desasigna al propietario actual. */
  userId?: number | null;
  status: boolean;
}
