// ── Guide ────────────────────────────────────────────────
export interface GuideResponse {
  id: number;
  guideNumber: string;
  supplierId: number;
  supplierName: string;
  carrierId: number | null;
  carrierName: string | null;
  truckId: number | null;
  truckLicensePlate: string | null;
  shipmentDate: string;
  estimatedArrivalDate: string | null;
  guideStatus: string;
  totalTransportCost: number;
  createdAt: string;
  detailCount: number;
  /** Puestos distintos a los que reparte: el número de subguías. */
  stallCount: number;
}

export interface GuideHeaderResponse {
  id: number;
  guideNumber: string;
  supplierId: number;
  supplierName: string;
  supplierTaxId: string;
  carrierId: number | null;
  carrierName: string | null;
  carrierDocumentId: string | null;
  truckId: number | null;
  truckLicensePlate: string | null;
  truckBrand: string | null;
  truckModel: string | null;
  shipmentDate: string;
  estimatedArrivalDate: string | null;
  observations: string | null;
  guideStatus: string;
  totalTransportCost: number;
  createdBy: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface GuideDetailResponse {
  id: number;
  guideId: number;
  destinationStallId: number;
  stallNumber: string;
  pavilionName: string;
  productId: number;
  productName: string;
  categoryName: string | null;
  brandId: number | null;
  brandName: string | null;
  productSizeId: number | null;
  productSizeName: string | null;
  logisticUnitId: number;
  logisticUnitName: string;
  logisticUnitAbbr: string | null;
  quantity: number;
  unitPrice: number;
  transportUnitPrice: number;
  transportSubtotal: number;
  observations: string | null;
  status: boolean;
}

export interface GuideReadResponse {
  header: GuideHeaderResponse;
  details: GuideDetailResponse[];
}

export interface CreateGuideRequest {
  supplierId: number;
  carrierId?: number;
  truckId?: number;
  shipmentDate: string;
  estimatedArrivalDate?: string;
  observations?: string;
  createdBy: number;
}

export interface CreateGuideDetailRequest {
  guideId: number;
  destinationStallId: number;
  productId: number;
  brandId?: number;
  productSizeId?: number;
  logisticUnitId: number;
  quantity: number;
  unitPrice: number;
  transportUnitPrice: number;
  observations?: string;
}

export interface UpdateGuideDetailRequest {
  id: number;
  destinationStallId: number;
  productId: number;
  brandId?: number;
  productSizeId?: number;
  logisticUnitId: number;
  quantity: number;
  unitPrice: number;
  transportUnitPrice: number;
  observations?: string;
}

export interface UpdateGuideStatusRequest {
  id: number;
  guideStatus: string;
}
