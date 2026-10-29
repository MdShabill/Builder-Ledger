// Path: src/services/dailyAttendanceService.ts
import { API_URLS } from "../constants/urls";

const BASE = API_URLS.attendance.base;
const headers = (siteId: number): HeadersInit => ({ "Content-Type": "application/json", "X-Site-Id": String(siteId) });

export interface DailyAttendanceDto { 
  id: number; date: string; serviceTypeId: number; name: string; serviceProviderId: number; 
  serviceProviderName: string; totalWorker: number; amountPerWorker: number; totalAmount: number; notes?: string; }
export interface AddDailyAttendanceDto { 
  date: string; serviceTypeId: number; serviceProviderId: number; totalWorker: number; notes?: string; }
export interface ServiceTypeOption { 
  id: number; name: string; }
export interface ServiceProviderOption { 
  serviceProviderId: number; serviceProviderName: string; }
export interface ServiceTypeCost { 
  serviceTypeId: number; serviceTypeName: string; cost: number; }
export interface DropdownDataResponse { 
  serviceTypes: ServiceTypeOption[]; serviceTypeCosts: ServiceTypeCost[]; }
export interface CostByServiceTypeResponse { 
  cost: number; serviceProviders: ServiceProviderOption[]; }

async function check(res: Response, message: string) {
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || message); }
  return res;
}

export const getDailyAttendances = async (
  siteId: number, dateFrom?: string, dateTo?: string): Promise<DailyAttendanceDto[]> => {
  const params = new URLSearchParams();
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  const query = params.toString() ? `?${params}` : "";
  return (await check(
      await fetch(`${BASE}${query}`, { headers: headers(siteId) }), "Failed to load attendance records")).json();
};

export const getDropdownData = async (siteId: number): Promise<DropdownDataResponse> =>
  (await check(
    await fetch(API_URLS.attendance.dropdown, 
      { headers: headers(siteId) }), "Failed to load dropdown data")).json();

export const getCostByServiceType = async (siteId: number, serviceTypeId: number): Promise<CostByServiceTypeResponse> =>
  (await check(
    await fetch(`${API_URLS.attendance.costByServiceType}?serviceTypeId=${serviceTypeId}`, 
      { headers: headers(siteId) }), "Failed to fetch cost/providers")).json();

export const addDailyAttendance = async (siteId: number, payload: AddDailyAttendanceDto): Promise<void> => {
  await check(
    await fetch(BASE, { method: "POST", headers: headers(siteId), 
      body: JSON.stringify(payload) }), "Failed to add attendance");
};