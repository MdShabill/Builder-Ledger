// Path: src/services/materialPurchaseService.ts
import { API_URLS } from "../constants/urls";

const BASE = API_URLS.materialPurchase.base;

export interface MaterialPurchaseDto {
  id: number; date: string; supplierName: string; phoneNumber: string;
  brandName: string; materialName: string; unitPrice: number;
  unitOfMeasure: string; quantity: number; materialCost: number;
  deliveryCharge: number;
}

export interface AddMaterialPurchaseDto {
  date: string; supplierId: number; phoneNumber: string; brandId: number;
  materialId: number; unitOfMeasure: string; unitPrice: number;
  quantity: number; materialCost: number; deliveryCharge: number;
}

export interface DropdownOption { id: number; name: string; }
export interface DropdownDataResponse {
  suppliers: DropdownOption[]; materials: DropdownOption[]; brands: DropdownOption[];
}
export interface MaterialInfoResponse { unitOfMeasure: string; unitPrice: number; }
export interface MaterialPurchaseListResponse { items: MaterialPurchaseDto[]; totalCount: number; }

const makeHeaders = (siteId: number): HeadersInit => ({
  "Content-Type": "application/json",
  "X-Site-Id": String(siteId),
});

const getError = async (res: Response, fallback: string) => {
  const data = await res.json().catch(() => ({}));
  return new Error(data.message || fallback);
};

export const getMaterialPurchases = async (
  siteId: number, dateFrom?: string, dateTo?: string,
  materialId?: number, supplierId?: number, brandId?: number
): Promise<MaterialPurchaseListResponse> => {
  const params = new URLSearchParams();
  if (dateFrom) params.append("dateFrom", dateFrom);
  if (dateTo) params.append("dateTo", dateTo);
  if (materialId) params.append("materialId", String(materialId));
  if (supplierId) params.append("supplierId", String(supplierId));
  if (brandId) params.append("brandId", String(brandId));

  const query = params.size ? `?${params}` : "";
  const res = await fetch(`${BASE}${query}`, { headers: makeHeaders(siteId) });
  if (!res.ok) throw await getError(res, "Failed to load purchases");
  return res.json();
};

export const getDropdownData = async (): Promise<DropdownDataResponse> => {
  const res = await fetch(API_URLS.materialPurchase.dropdown);
  if (!res.ok) throw await getError(res, "Failed to load dropdown data");
  return res.json();
};

export const getMaterialInfo = async (materialId: number): Promise<MaterialInfoResponse> => {
  const res = await fetch(`${API_URLS.materialPurchase.materialInfo}?materialId=${materialId}`);
  if (!res.ok) throw await getError(res, "Failed to load material info");
  return res.json();
};

export const addMaterialPurchase = async (
  siteId: number, payload: AddMaterialPurchaseDto
): Promise<void> => {
  const res = await fetch(BASE, {
    method: "POST", headers: makeHeaders(siteId), body: JSON.stringify(payload),
  });
  if (!res.ok) throw await getError(res, "Failed to add purchase");
};

export const deleteMaterialPurchase = async (siteId: number, id: number): Promise<void> => {
  const res = await fetch(`${BASE}/${id}`, {
    method: "DELETE", headers: makeHeaders(siteId),
  });
  if (!res.ok) throw await getError(res, "Failed to delete");
};