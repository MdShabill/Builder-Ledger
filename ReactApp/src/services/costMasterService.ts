// Path: src/services/costMasterService.ts

import { API_URLS } from "../constants/urls";

const BASE = API_URLS.costMaster.base;
const headers = (siteId: number): HeadersInit => ({ "Content-Type": "application/json", "X-Site-Id": String(siteId) });

export interface ServiceTypeOption { 
  id: number; name: string; }
export interface CostMasterDto { 
  id: number; serviceTypeId: number; name: string; cost: number; date: string; }
export interface AddCostMasterDto {  
  serviceTypeId: number; cost: number; date: string; }
export interface CostMasterIndexResponse { 
  items: CostMasterDto[]; serviceTypes: ServiceTypeOption[]; selectedServiceTypeId: number; }

async function check(res: Response, message: string) {
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || message); }
  return res;
}

export const getCostMasters = async ( siteId: number, serviceTypeId?: number ): Promise<CostMasterIndexResponse> => {
  const url = serviceTypeId
    ? `${API_URLS.costMaster.index}?serviceTypeId=${serviceTypeId}`
    : API_URLS.costMaster.index;

  const res = await fetch(url, {
    headers: headers(siteId),
  });

  return (await check(res, "Failed to load cost masters")).json();
};

export const getActiveCost = async (siteId: number, serviceTypeId: number): Promise<CostMasterDto | null> => {
  const res = await fetch(`${API_URLS.costMaster.activeCost}?serviceTypeId=${serviceTypeId}`, { headers: headers(siteId) });
  if (res.status === 404) return null;
  return (await check(res, "Failed to load active cost")).json();
};

export const addCostMaster = async (siteId: number, payload: AddCostMasterDto): Promise<void> =>
  void (await check(
    await fetch(BASE, { method: "POST", headers: headers(siteId), 
      body: JSON.stringify(payload) }), "Failed to add cost master"));

export const getCostMasterById = async (siteId: number, id: number): Promise<CostMasterDto> =>
  (await check(
    await fetch(`${BASE}/${id}`, { headers: headers(siteId) }), "Failed to load cost master")).json();

export const updateCostMaster = async (siteId: number, id: number, payload: AddCostMasterDto): Promise<void> =>
  void (await check(
    await fetch(`${BASE}/${id}`, { method: "PUT", headers: headers(siteId), 
      body: JSON.stringify(payload) }), "Failed to update cost master"));

export const deleteCostMaster = async (siteId: number, id: number): Promise<void> =>
  void (await check(
    await fetch(`${BASE}/${id}`, { method: "DELETE", headers: headers(siteId) }), "Failed to delete cost master"));