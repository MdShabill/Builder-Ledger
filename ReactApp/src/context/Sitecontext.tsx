import { createContext, useContext, useState, type ReactNode } from "react";
import type { SiteDropdownDto } from "../services/siteService";

interface SiteContextType {
  selectedSite: SiteDropdownDto | null;
  setSelectedSite: (site: SiteDropdownDto | null) => void;
  hasSiteSelected: boolean;
}

const SiteContext = createContext<SiteContextType | null>(null);

export function SiteProvider({ children }: { children: ReactNode }) {
  
  const [selectedSite, setSelectedSiteState] =
  useState<SiteDropdownDto | null>(() => {
    const stored = sessionStorage.getItem("selectedSite");
    return stored ? JSON.parse(stored) : null;
  });

  const setSelectedSite = (site: SiteDropdownDto | null) => {
    setSelectedSiteState(site);
    if (site) {
      sessionStorage.setItem("selectedSite", JSON.stringify(site));
    } else {
      sessionStorage.removeItem("selectedSite");
    }
  };

  return (
    <SiteContext.Provider
      value={{
        selectedSite,
        setSelectedSite,
        hasSiteSelected: !!selectedSite,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSite must be used within SiteProvider");
  return ctx;
}