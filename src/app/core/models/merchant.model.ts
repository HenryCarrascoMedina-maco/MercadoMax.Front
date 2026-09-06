// ── ReceptionConfirmation ────────────────────────────────
export interface ReceptionConfirmationResponse {
  id: number;
  receptionId: number;
  stallId: number;
  stallCode: string;
  confirmationDate: string;
  observations: string;
  userId: number;
  createdAt: string;
}

export interface CreateReceptionConfirmationRequest {
  receptionId: number;
  stallId: number;
  confirmationDate: string;
  observations?: string;
  userId: number;
}

// ── Inventory ────────────────────────────────────────────
export interface InventoryResponse {
  id: number;
  stallId: number;
  stallCode: string;
  productId: number;
  productName: string;
  logisticUnitId: number;
  logisticUnitName: string;
  currentStock: number;
  minimumStock: number;
  averageCost: number;
  status: boolean;
  lastUpdated: string;
}

export interface CreateInventoryRequest {
  stallId: number;
  productId: number;
  logisticUnitId: number;
  currentStock: number;
  minimumStock: number;
  averageCost: number;
  userId: number;
}

export interface UpdateInventoryRequest {
  id: number;
  minimumStock: number;
}

// ── InventoryMovement ────────────────────────────────────
export interface InventoryMovementResponse {
  id: number;
  inventoryId: number;
  movementType: string;
  quantity: number;
  referenceId: number | null;
  referenceType: string | null;
  observations: string | null;
  movementDate: string;
  userId: number;
  userName: string;
}

export interface CreateInventoryMovementRequest {
  inventoryId: number;
  movementType: string;
  quantity: number;
  referenceId?: number;
  referenceType?: string;
  observations?: string;
  userId: number;
}
