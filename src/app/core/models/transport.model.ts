// ── Carrier ──────────────────────────────────────────────
export interface CarrierResponse {
  id: number;
  firstName: string;
  lastName: string;
  documentId: string;
  phone: string;
  licenseNumber: string;
  userId: number;
  status: boolean;
  createdAt: string;
}

export interface CreateCarrierRequest {
  firstName: string;
  lastName: string;
  documentId: string;
  phone: string;
  licenseNumber: string;
  userId: number;
}

export interface UpdateCarrierRequest {
  id: number;
  firstName: string;
  lastName: string;
  documentId: string;
  phone: string;
  licenseNumber: string;
  userId: number;
  status: boolean;
}

// ── Truck ────────────────────────────────────────────────
// `capacityKg` es la capacidad real, en kilos, y es la que usan los cálculos de
// carga de una guía. `capacity` es la columna de texto original: el backend la
// sigue devolviendo y rellenando por compatibilidad, pero no se escribe desde
// aquí ni sirve para comparar nada.
export interface TruckResponse {
  id: number;
  licensePlate: string;
  carrierId: number;
  carrierName: string;
  capacity: string;
  capacityKg: number | null;
  brand: string;
  model: string;
  status: boolean;
  createdAt: string;
}

export interface CreateTruckRequest {
  licensePlate: string;
  carrierId: number;
  capacityKg?: number | null;
  brand: string;
  model: string;
}

export interface UpdateTruckRequest {
  id: number;
  licensePlate: string;
  carrierId: number;
  capacityKg?: number | null;
  brand: string;
  model: string;
  status: boolean;
}

// ── TransportRate ────────────────────────────────────────
export interface TransportRateResponse {
  id: number;
  carrierId: number;
  carrierName: string;
  logisticUnitId: number;
  logisticUnitName: string;
  routeOrigin: string;
  routeDestination: string;
  unitPrice: number;
  effectiveDate: string;
  status: boolean;
  createdAt: string;
}

export interface CreateTransportRateRequest {
  carrierId: number;
  logisticUnitId: number;
  routeOrigin: string;
  routeDestination: string;
  unitPrice: number;
  effectiveDate: string;
}

export interface UpdateTransportRateRequest {
  id: number;
  carrierId: number;
  logisticUnitId: number;
  routeOrigin: string;
  routeDestination: string;
  unitPrice: number;
  effectiveDate: string;
  status: boolean;
}

// ── Settlement ───────────────────────────────────────────
export interface SettlementListResponse {
  id: number;
  carrierId: number;
  carrierName: string;
  truckId: number;
  truckPlate: string;
  tripDate: string;
  settlementStatus: string;
  totalAmount: number;
  detailCount: number;
  createdAt: string;
}

export interface SettlementHeaderResponse {
  id: number;
  carrierId: number;
  carrierName: string;
  truckId: number;
  truckPlate: string;
  tripDate: string;
  settlementStatus: string;
  totalAmount: number;
  createdAt: string;
}

export interface SettlementDetailResponse {
  id: number;
  settlementId: number;
  guideId: number;
  guideNumber: string;
  logisticUnitId: number;
  logisticUnitName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SettlementReadResponse {
  header: SettlementHeaderResponse;
  details: SettlementDetailResponse[];
}

export interface CreateSettlementRequest {
  carrierId: number;
  truckId?: number;
  tripDate: string;
}

export interface UpdateSettlementStatusRequest {
  id: number;
  settlementStatus: string;
}

export interface CreateSettlementDetailRequest {
  settlementId: number;
  guideId: number;
  logisticUnitId: number;
  quantity: number;
  unitPrice: number;
}
