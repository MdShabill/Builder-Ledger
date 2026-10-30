import { API_URLS } from "../constants/urls";

export const getDropdownData = async () => {
  const res = await fetch(API_URLS.site.masterData);

  if (!res.ok) {
    throw new Error("Failed to fetch dropdown");
  }

  return res.json();
};