import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/Authcontext";
import { useSite } from "../context/Sitecontext";

interface SessionCheckProps {
  children: ReactNode;
}

/**
 * React equivalent of SessionCheckAttribute.cs
 *
 * MVC logic being mirrored:
 *   1. if (userId == null) -> redirect to Login
 *   2. if (controllerName != "Site" && siteId == null) -> redirect to NoSiteSelcted
 *
 * Usage: wrap any route that needs both login + site selection
 * (i.e. every route except /login and /sites)
 */
export default function SessionCheck({ children }: SessionCheckProps) {
  const { user } = useAuth();
  const { hasSiteSelected } = useSite();
  const location = useLocation();

  // Step 1 — not logged in -> Login (same as MVC's userId == null check)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Step 2 — logged in but no site selected -> NoSiteSelected page
  // (Site routes themselves are exempt — handled by NOT wrapping them in SessionCheck)
  if (!hasSiteSelected) {
    return <Navigate to="/no-site-selected" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}