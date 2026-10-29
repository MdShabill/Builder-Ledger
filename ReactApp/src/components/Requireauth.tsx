import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/Authcontext";

/**
 * React equivalent of the Site-controller exemption in SessionCheckAttribute.cs:
 *
 *   if (!string.Equals(controllerName, "Site", ...))
 *   {
 *       if (siteId == null) redirect to NoSiteSelcted;
 *   }
 *
 * The Site controller itself only needs login, NOT a selected site
 * (since selecting the site is literally what happens there).
 * Use this guard for /sites, /sites/add, /sites/edit/:id
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}