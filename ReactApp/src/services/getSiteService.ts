//Path: src/services/getSiteService.ts
import { API_URLS } from "../constants/urls";

export interface SiteDto {
  id: number;
  name: string;
  startedDate: string;
  siteStatusId: number;
  status: string;
  addressLine1?: string;
  addressTypes?: string;
  countryName?: string;
  pinCode?: number;
}

export const getAllSites = async (): Promise<SiteDto[]> => {
  const res = await fetch(API_URLS.site.all);
  if (!res.ok) throw new Error("Failed to fetch sites");
  return res.json();
};

export const getSiteById = async (id: number) => {
  const res = await fetch(API_URLS.site.select(id));
  if (!res.ok) throw new Error("Site not found");
  return res.json();
};