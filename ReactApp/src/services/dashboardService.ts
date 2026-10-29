// Path: src/services/dashboardService.ts
import { API_URLS } from "../constants/urls";

export interface DashboardStatsDto {
  totalMaterialSpend: number; totalPurchases: number; totalAttendanceWorkers: number;
  totalSites: number; activeSites: number; holdSites: number; totalPendingScopes: number;
  thisMonthSpend: number; thisMonthPurchases: number; thisMonthAttendance: number;
  hasSiteInfo: boolean; siteName?: string; siteStatus?: string; siteStartedDate?: string; siteExpectedCompletion?: string;
  expectedBudget?: number; budgetRemaining?: number; budgetUtilizationPercent?: number;
  daysElapsed?: number; daysRemaining?: number; timelineProgressPercent?: number; isOverdue: boolean;
  totalScopes: number; completedScopes: number; inProgressScopes: number; pendingScopes: number;
  onHoldScopes: number; notStartedScopes: number; scopeCompletionPercent: number;
  lastMaterialActivity?: string; lastAttendanceActivity?: string;
}

export interface ScopeSummaryItemDto {
  id: number; scopeName: string; scopeStatusId: number; statusName: string;
  remarks?: string; completedDate?: string;
}

export interface MonthlyActivityDto {
  month: number; year: number; monthlySpend: number;
  monthlyPurchases: number; monthlyAttendance: number;
}

async function getData<T>(url: string, message: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(message);
  return res.json();
}

export const getDashboardStats = (siteId: number = 0): Promise<DashboardStatsDto> =>
  getData(`${API_URLS.dashboard.stats}?siteId=${siteId}`, "Failed to load dashboard stats");

export const getDashboardScopeItems = (siteId: number): Promise<ScopeSummaryItemDto[]> =>
  getData(`${API_URLS.dashboard.scopeItems}?siteId=${siteId}`, "Failed to load scope items");

export const getMonthlyActivity = (siteId: number, month: number, year: number): Promise<MonthlyActivityDto> =>
  getData(`${API_URLS.dashboard.monthlyActivity}?siteId=${siteId}&month=${month}&year=${year}`, "Failed to load monthly activity");