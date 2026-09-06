// ── Reception ────────────────────────────────────────────
export interface ReceptionListResponse {
  id: number;
  guideId: number;
  guideNumber: string;
  stallId: number;
  stallCode: string;
  receptionDate: string;
  receptionStatus: string;
  observations: string;
  detailCount: number;
  createdAt: string;
}

export interface ReceptionHeaderResponse {
  id: number;
  guideId: number;
  guideNumber: string;
  stallId: number;
  stallCode: string;
  receptionDate: string;
  receptionStatus: string;
  observations: string;
  createdAt: string;
}

export interface ReceptionDetailResponse {
  id: number;
  receptionId: number;
  productId: number;
  productName: string;
  logisticUnitId: number;
  logisticUnitName: string;
  expectedQuantity: number;
  receivedQuantity: number;
  condition: string;
  createdAt: string;
}

export interface ReceptionReadResponse {
  header: ReceptionHeaderResponse;
  details: ReceptionDetailResponse[];
}

export interface CreateReceptionRequest {
  guideId: number;
  /**
   * La recepción es de la guía entera: `reception.Reception` no tiene puesto y
   * el reparto vive en las líneas de la guía. Antes se enviaba un `stallId` que
   * el SP no acepta, y la llamada fallaba con un 500.
   */
  receptionDate: string;
  observations?: string;
  userId: number;
}

export interface UpdateReceptionStatusRequest {
  id: number;
  receptionStatus: string;
}

export interface CreateReceptionDetailRequest {
  receptionId: number;
  productId: number;
  logisticUnitId: number;
  expectedQuantity: number;
  receivedQuantity: number;
  condition?: string;
}

export interface UpdateReceptionDetailRequest {
  id: number;
  receivedQuantity: number;
  condition?: string;
  expectedQuantity: number;
  productId: number;
}

// ── Shortage ─────────────────────────────────────────────
export interface ShortageResponse {
  id: number;
  receptionDetailId: number;
  shortageQuantity: number;
  reason: string;
  claimStatus: string;
  evidence: string;
  productName: string;
  createdAt: string;
}

export interface CreateShortageRequest {
  receptionDetailId: number;
  shortageQuantity: number;
  reason: string;
  evidence?: string;
  userId: number;
}

export interface UpdateShortageStatusRequest {
  id: number;
  claimStatus: string;
}
