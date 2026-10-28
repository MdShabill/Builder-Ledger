using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BuilderLedger.Core.DataModels
{
    public class DashboardStats
    {
        // ── ALL-TIME (filtered by site) ──────────────
        public decimal TotalMaterialSpend { get; set; }
        public int TotalPurchases { get; set; }
        public int TotalAttendanceWorkers { get; set; }

        // ── OVERVIEW (always all sites) ──────────────
        public int TotalSites { get; set; }
        public int ActiveSites { get; set; }
        public int HoldSites { get; set; }
        public int TotalPendingScopes { get; set; }

        // ── THIS MONTH (filtered by site) ────────────
        public decimal ThisMonthSpend { get; set; }
        public int ThisMonthPurchases { get; set; }
        public int ThisMonthAttendance { get; set; }

        // ── SITE SPECIFIC ─────────────────────────────
        public string? SiteName { get; set; }
        public string? SiteStatus { get; set; }
        public DateTime? SiteStartedDate { get; set; }
        public DateTime? SiteExpectedCompletion { get; set; }
        public decimal? ExpectedBudget { get; set; }

        // ── SCOPE COUNTS ─────────────────────────────
        public int TotalScopes { get; set; }
        public int CompletedScopes { get; set; }
        public int InProgressScopes { get; set; }
        public int PendingScopes { get; set; }
        public int OnHoldScopes { get; set; }
        public int NotStartedScopes { get; set; }

        // ── LAST ACTIVITY ────────────────────────────
        public DateTime? LastMaterialActivity { get; set; }
        public DateTime? LastAttendanceActivity { get; set; }
    }
}
