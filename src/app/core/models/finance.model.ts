// ──────────────────────────────────────────────────────────
// SALE
// ──────────────────────────────────────────────────────────

export interface CreateSaleRequest {
  stallId: number;
  customerName?: string;
  paymentType: string; // Cash | Credit
  userId: number;
}

export interface CreateSaleDetailRequest {
  saleId: number;
  productId: number;
  brandId?: number;
  productSizeId?: number;
  logisticUnitId: number;
  quantity: number;
  unitPrice: number;
}

export interface VoidSaleRequest {
  id: number;
}

export interface SaleListResponse {
  id: number;
  stallId: number;
  stallNumber: string;
  customerName?: string;
  saleDate: string;
  totalAmount: number;
  paymentType: string;
  saleStatus: string;
  userId: number;
  userName: string;
  detailCount: number;
}

export interface SaleHeaderResponse {
  id: number;
  stallId: number;
  stallNumber: string;
  pavilionName: string;
  customerName?: string;
  saleDate: string;
  totalAmount: number;
  paymentType: string;
  saleStatus: string;
  userId: number;
  userName: string;
  createdAt: string;
}

export interface SaleDetailResponse {
  id: number;
  saleId: number;
  productId: number;
  productName: string;
  brandId?: number;
  brandName?: string;
  productSizeId?: number;
  productSizeName?: string;
  logisticUnitId: number;
  logisticUnitName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SaleReadResponse {
  header: SaleHeaderResponse;
  details: SaleDetailResponse[];
}

// ──────────────────────────────────────────────────────────
// ACCOUNT PAYABLE
// ──────────────────────────────────────────────────────────

export interface CreateAccountPayableRequest {
  stallId: number;
  supplierId: number;
  guideId: number;
  totalAmount: number;
  dueDate?: string;
}

/**
 * Línea que la guía trae a un puesto. Cantidad, producto, marca y calibre vienen
 * de la guía; lo único que se edita en la cuenta por pagar es `unitPrice`.
 */
export interface GuideLineForPayable {
  guideDetailId: number;
  productId: number;
  productName: string;
  brandId: number | null;
  brandName: string | null;
  productSizeId: number | null;
  productSizeName: string | null;
  logisticUnitId: number;
  logisticUnitName: string;
  logisticUnitAbbr: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface PayableLinePrice {
  guideDetailId: number;
  unitPrice: number;
}

/**
 * No lleva importe a propósito: el total lo calcula el backend sumando
 * cantidad × precio de las líneas, para que no pueda guardarse una cuenta cuyo
 * total no cuadre con su detalle.
 */
export interface CreateAccountPayableFromGuideRequest {
  stallId: number;
  supplierId: number;
  guideId: number;
  dueDate?: string;
  lines: PayableLinePrice[];
}

export interface AccountPayableListResponse {
  id: number;
  stallId: number;
  stallNumber: string;
  supplierId: number;
  supplierName: string;
  guideId: number;
  guideNumber: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  dueDate?: string;
  accountStatus: string;
  createdAt: string;
}

export interface AccountPayableHeaderResponse {
  id: number;
  stallId: number;
  stallNumber: string;
  supplierId: number;
  supplierName: string;
  guideId: number;
  guideNumber: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  dueDate?: string;
  accountStatus: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PaymentResponse {
  id: number;
  accountPayableId: number;
  amount: number;
  paymentMethod: string;
  operationNumber?: string;
  paymentDate: string;
  observations?: string;
  userId: number;
  userName: string;
}

export interface AccountPayableReadResponse {
  header: AccountPayableHeaderResponse;
  payments: PaymentResponse[];
}

export interface CreatePaymentRequest {
  accountPayableId: number;
  amount: number;
  paymentMethod: string;
  operationNumber?: string;
  observations?: string;
  userId: number;
}

// ── Report ────────────────────────────────────────────────

export interface AccountStatementSummary {
  stallNumber: string;
  pavilionName: string;
  ownerName: string;
  totalDebt: number;
  totalPaid: number;
  totalBalance: number;
  accountCount: number;
}

export interface AccountStatementDetail {
  id: number;
  supplierName: string;
  guideNumber: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  dueDate?: string;
  accountStatus: string;
  createdAt: string;
}

export interface AccountStatementResponse {
  summary?: AccountStatementSummary;
  details: AccountStatementDetail[];
}
