// Path: src/services/serviceProviderService.ts
import { API_URLS } from "../constants/urls";

const BASE = API_URLS.serviceProvider.base;

export interface ServiceProviderDto {
  serviceProviderId: number; serviceProviderName: string; serviceTypeId: number;
  serviceTypes: string; gender: string; dob?: string; mobileNumber: string;
  referredBy: string; addressTypeId?: number; addressTypes?: string;
  countryId?: number; countryName?: string; addressLine1?: string; pinCode?: number;
}

export interface AddServiceProviderDto {
  serviceProviderName: string; serviceTypeId: number; gender: string;
  dob: string; mobileNumber: string; referredBy: string; addressLine1?: string;
  addressTypeId?: number; countryId?: number; pinCode?: number; siteId?: number;
}

export interface DropdownOption { id: number; name: string; }
export interface SPDropdownResponse {
  serviceTypes: DropdownOption[]; addressTypes: DropdownOption[]; countries: DropdownOption[];
}
export interface SPListResponse { items: ServiceProviderDto[]; totalCount: number; }

const getError = async (res: Response, message: string) => {
  const data = await res.json().catch(() => ({}));
  return new Error(data.message || message);
};

export const getServiceProviders = async (serviceTypeId?: number): Promise<SPListResponse> => {
  const query = serviceTypeId ? `?serviceTypeId=${serviceTypeId}` : "";
  const res = await fetch(`${BASE}${query}`);
  if (!res.ok) throw await getError(res, "Failed to load service providers");
  return res.json();
};

export const getServiceProviderById = async (id: number): Promise<ServiceProviderDto> => {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error("Service Provider not found");
  return res.json();
};

export const getSPDropdownData = async (): Promise<SPDropdownResponse> => {
  const res = await fetch(API_URLS.serviceProvider.dropdown);
  if (!res.ok) throw new Error("Failed to load dropdown data");
  return res.json();
};

export const addServiceProvider = async (payload: AddServiceProviderDto): Promise<void> => {
  const res = await fetch(BASE, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await getError(res, "Failed to add");
};

export const updateServiceProvider = async (id: number, payload: AddServiceProviderDto): Promise<void> => {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await getError(res, "Failed to update");
};

export const deleteServiceProvider = async (id: number): Promise<void> => {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw await getError(res, "Failed to delete");
};