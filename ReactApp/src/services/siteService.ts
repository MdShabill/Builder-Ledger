
import { API_URLS } from "../constants/urls";

const URL = API_URLS.site;
const JSON_HEADERS = { "Content-Type": "application/json" };

// ─── Interfaces ──────────────────────────────────────────

export interface SiteDropdownDto { id: number; name: string; }
export interface DropdownItem { id: number; name: string; }
export interface ProviderOption { id: number; name: string; }
interface KeyValuePairOption { key: number; value: string; }
export type ProviderApiOption = ProviderOption | KeyValuePairOption;
export interface ScopeMasterOption { id: number; name: string; }
export interface ScopeStatusOption { id: number; name: string; }

export interface SiteScopeVm {
  id: number; siteScopeMasterId: number; scopeName: string;
  scopeStatusId: number; statusName: string; remarks?: string; completedDate?: string;
}

export interface ScopeItemDto {
  siteScopeMasterId: number; scopeStatusId: number; remarks?: string;
}

export interface SiteListDto {
  id: number; name: string; startedDate: string;
  contactName?: string; contactNumber?: string; siteStatusId?: number; status?: string;
  addressLine1?: string; addressTypes?: string; countryName?: string; pinCode?: number;
  expectedBudget?: number; expectedCompletionDate?: string;
}

export interface SiteEditDto extends SiteListDto {
  masterMasonIds: number[]; electricianIds: number[]; labourIds: number[];
  plumberIds: number[]; painterIds: number[]; carpenterIds: number[];
  tilerIds: number[]; scopes: SiteScopeVm[];
}

export interface SiteCreateDto {
  name: string; startedDate: string; siteStatusId: number;
  contactName?: string; contactNumber?: string; note?: string;
  addressLine1?: string; addressTypeId?: number; countryId?: number; pinCode?: number;
  expectedBudget?: number; expectedCompletionDate?: string;
  selectedMasterMasonIds: number[]; selectedElectricianIds: number[];
  selectedLabourIds: number[]; selectedPlumberIds: number[];
  selectedPainterIds: number[]; selectedCarpenterIds: number[];
  selectedTilerIds: number[]; selectedScopes: ScopeItemDto[];
}

export interface DropdownResponse {
  statuses: DropdownItem[]; addressTypes: DropdownItem[]; countries: DropdownItem[];
  scopeMasters: ScopeMasterOption[]; scopeStatuses: ScopeStatusOption[];
}

export interface ServiceProviderResponse {
  masterMasons: ProviderApiOption[]; electricians: ProviderApiOption[];
  labours: ProviderOption[]; plumbers: ProviderOption[];
  painters: ProviderOption[]; carpenters: ProviderOption[]; tilers: ProviderOption[];
}

export interface SiteFilterParams {
  search?: string; statusId?: number; fromDate?: string; toDate?: string;
  budgetFrom?: number; budgetTo?: number;
}

export interface SiteMasterDataParams {
  siteStatusData?: boolean;
  addressTypeData?: boolean;
  countriesData?: boolean;
  scopeMastersData?: boolean;
  scopeStatusesData?: boolean;
}

// ─── Helper ──────────────────────────────────────────────

const getError = async (res: Response, message: string): Promise<Error> => {
  const text = await res.text().catch(() => "");
  try {
    const data = JSON.parse(text);
    return new Error(data?.message || data?.title || message);
  } catch {
    return new Error(text || message);
  }
};

const fetchJson = async <T>(url: string, error: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) throw await getError(res, error);
  return res.json();
};

// ─── Site APIs ───────────────────────────────────────────

// GET /Site
export const getNavbarSites = () =>
  fetchJson<SiteDropdownDto[]>(URL.base, "Failed to fetch sites");

// GET /Site
export const getAllSites = () =>
  fetchJson<SiteListDto[]>(URL.base, "Failed to fetch sites");

// GET /Site/{id}
export const getSite = (id: number) =>
  fetchJson<SiteEditDto>(URL.item(id), "Site not found");

// GET /Site/master-data
export const getMasterData = (options: SiteMasterDataParams): Promise<DropdownResponse> => {
  const params = new URLSearchParams();
  Object.entries(options).forEach(([key, value]) => {
    if (value === true) params.append(key, "true");
  });
  return fetchJson<DropdownResponse>(
    `${URL.masterData}?${params}`, "Failed to fetch master data"
  );
};

// GET /Site/service-providers
export const getServiceProviders = () =>
  fetchJson<ServiceProviderResponse>(URL.providers, "Failed to fetch service providers");

// POST /Site
export const createSite = async (payload: SiteCreateDto): Promise<number> => {
  const res = await fetch(URL.base, {
    method: "POST", headers: JSON_HEADERS, body: JSON.stringify(payload),
  });
  if (!res.ok) throw await getError(res, "Failed to create site");
  return (await res.json()).siteId;
};

// PUT /Site/{id}
export const updateSite = async (payload: SiteCreateDto & { id: number }): Promise<void> => {
  const res = await fetch(URL.item(payload.id), {
    method: "PUT", headers: JSON_HEADERS, body: JSON.stringify(payload),
  });
  if (!res.ok) throw await getError(res, "Failed to update site");
};

// DELETE /Site/{id}
export const deleteSite = async (siteId: number): Promise<void> => {
  const res = await fetch(URL.item(siteId), { method: "DELETE" });
  if (!res.ok) throw await getError(res, "Failed to delete site");
};

// PATCH /Site/scope-status
export const updateScopeStatus = async (
  siteScopeId: number, scopeStatusId: number, remarks?: string
): Promise<void> => {
  const res = await fetch(URL.scopeStatus, {
    method: "PATCH", headers: JSON_HEADERS,
    body: JSON.stringify({ siteScopeId, scopeStatusId, remarks }),
  });
  if (!res.ok) throw await getError(res, "Failed to update scope status");
};

// GET /Site/filter
export const filterSites = async (filters: SiteFilterParams): Promise<SiteListDto[]> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "")
      params.append(key, String(value).trim());
  });
  return fetchJson<SiteListDto[]>(
    `${URL.filter}${params.size ? `?${params}` : ""}`,
    "Failed to filter sites"
  );
};
