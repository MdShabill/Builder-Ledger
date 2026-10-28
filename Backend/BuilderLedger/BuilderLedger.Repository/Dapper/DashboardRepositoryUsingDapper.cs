using BuilderLedger.Core.DataModels;
using BuilderLedger.Repository.Interfaces;
using Dapper;
using System.Data.SqlClient;

namespace BuilderLedger.Repository.Dapper
{
    public class DashboardRepositoryUsingDapper : IDashboardRepository
    {
        private readonly string _connectionString;

        public DashboardRepositoryUsingDapper(string connectionString)
        {
            _connectionString = connectionString;
        }

        public DashboardStats GetStats(int siteId)
        {
            using var connection = new SqlConnection(_connectionString);

            string sql = @"
                SELECT
                    -- ── ALL-TIME STATS (site filtered) ──
                    (
                        SELECT ISNULL(SUM(MaterialCost + ISNULL(DeliveryCharge, 0)), 0)
                        FROM   MaterialPurchase
                        WHERE  (@SiteId = 0 OR SiteId = @SiteId)
                    ) AS TotalMaterialSpend,

                    (
                        SELECT COUNT(*)
                        FROM   MaterialPurchase
                        WHERE  (@SiteId = 0 OR SiteId = @SiteId)
                    ) AS TotalPurchases,

                    (
                        SELECT ISNULL(SUM(TotalWorker), 0)
                        FROM   DailyAttendance
                        WHERE  (@SiteId = 0 OR SiteId = @SiteId)
                    ) AS TotalAttendanceWorkers,

                    -- ── OVERVIEW (always all sites) ──
                    (SELECT COUNT(*) FROM Sites) AS TotalSites,

                    (
                        SELECT COUNT(*) FROM Sites
                        WHERE SiteStatusId IN (1, 2)
                    ) AS ActiveSites,

                    (
                        SELECT COUNT(*)
                        FROM Sites s
                        INNER JOIN SiteStatus ss ON s.SiteStatusId = ss.Id
                        WHERE ss.Status = 'On Hold'
                    ) AS HoldSites,

                    (
                        SELECT COUNT(*) FROM SiteScope
                        WHERE  ScopeStatusId IN (1, 5)
                    ) AS TotalPendingScopes,

                    -- ── THIS MONTH (site filtered) ──
                    (
                        SELECT ISNULL(SUM(MaterialCost + ISNULL(DeliveryCharge, 0)), 0)
                        FROM   MaterialPurchase
                        WHERE  MONTH(Date) = MONTH(GETDATE())
                          AND  YEAR(Date)  = YEAR(GETDATE())
                          AND  (@SiteId = 0 OR SiteId = @SiteId)
                    ) AS ThisMonthSpend,

                    (
                        SELECT COUNT(*)
                        FROM   MaterialPurchase
                        WHERE  MONTH(Date) = MONTH(GETDATE())
                          AND  YEAR(Date)  = YEAR(GETDATE())
                          AND  (@SiteId = 0 OR SiteId = @SiteId)
                    ) AS ThisMonthPurchases,

                    (
                        SELECT ISNULL(SUM(TotalWorker), 0)
                        FROM   DailyAttendance
                        WHERE  MONTH(Date) = MONTH(GETDATE())
                          AND  YEAR(Date)  = YEAR(GETDATE())
                          AND  (@SiteId = 0 OR SiteId = @SiteId)
                    ) AS ThisMonthAttendance,

                    -- ── SITE SPECIFIC (only when siteId > 0) ──
                    (SELECT TOP 1 Name FROM Sites WHERE Id = @SiteId) AS SiteName,

                    (SELECT TOP 1 ss.Status
                     FROM   Sites s
                     JOIN   SiteStatus ss ON s.SiteStatusId = ss.Id
                     WHERE  s.Id = @SiteId) AS SiteStatus,

                    (SELECT TOP 1 StartedDate FROM Sites WHERE Id = @SiteId) AS SiteStartedDate,
                    (SELECT TOP 1 ExpectedCompletionDate FROM Sites WHERE Id = @SiteId) AS SiteExpectedCompletion,
                    (SELECT TOP 1 ExpectedBudget FROM Sites WHERE Id = @SiteId) AS ExpectedBudget,

                    -- ── SCOPE COUNTS (site filtered) ──
                    (SELECT COUNT(*) FROM SiteScope WHERE (@SiteId=0 OR SiteId=@SiteId)) AS TotalScopes,
                    (SELECT COUNT(*) FROM SiteScope WHERE ScopeStatusId=3 AND (@SiteId=0 OR SiteId=@SiteId)) AS CompletedScopes,
                    (SELECT COUNT(*) FROM SiteScope WHERE ScopeStatusId=2 AND (@SiteId=0 OR SiteId=@SiteId)) AS InProgressScopes,
                    (SELECT COUNT(*) FROM SiteScope WHERE ScopeStatusId=1 AND (@SiteId=0 OR SiteId=@SiteId)) AS PendingScopes,
                    (SELECT COUNT(*) FROM SiteScope WHERE ScopeStatusId=4 AND (@SiteId=0 OR SiteId=@SiteId)) AS OnHoldScopes,
                    (SELECT COUNT(*) FROM SiteScope WHERE ScopeStatusId=5 AND (@SiteId=0 OR SiteId=@SiteId)) AS NotStartedScopes,

                    -- ── LAST ACTIVITY ──
                    (SELECT MAX(Date) FROM MaterialPurchase  WHERE (@SiteId=0 OR SiteId=@SiteId)) AS LastMaterialActivity,
                    (SELECT MAX(Date) FROM DailyAttendance   WHERE (@SiteId=0 OR SiteId=@SiteId)) AS LastAttendanceActivity";

            return connection.QuerySingleOrDefault<DashboardStats>(sql, new { SiteId = siteId }) ?? new DashboardStats();
        }

        public List<SiteScope> GetScopeItems(int siteId)
        {
            using SqlConnection connection = new(_connectionString);

            return connection.Query<SiteScope>(@"
                SELECT
                    ss.Id,
                    sm.ScopeName,
                    ss.ScopeStatusId,
                    sc.StatusName,
                    ss.Remarks,
                    ss.CompletedDate
                FROM  SiteScope      ss
                JOIN  SiteScopeMaster sm ON ss.SiteScopeId   = sm.Id
                JOIN  ScopeStatus    sc ON ss.ScopeStatusId  = sc.Id
                WHERE ss.SiteId = @SiteId
                ORDER BY sm.Id",
                new { SiteId = siteId }).ToList();
        }

        public MonthlyActivityStats GetMonthlyActivity(int siteId, int month, int year)
        {
            using SqlConnection connection = new(_connectionString);

            string sql = @"
                SELECT
                    (
                        SELECT ISNULL(SUM(MaterialCost + ISNULL(DeliveryCharge, 0)), 0)
                        FROM   MaterialPurchase
                        WHERE  MONTH(Date) = @Month
                          AND  YEAR(Date)  = @Year
                          AND  (@SiteId = 0 OR SiteId = @SiteId)
                    ) AS MonthlySpend,

                    (
                        SELECT COUNT(*)
                        FROM   MaterialPurchase
                        WHERE  MONTH(Date) = @Month
                          AND  YEAR(Date)  = @Year
                          AND  (@SiteId = 0 OR SiteId = @SiteId)
                    ) AS MonthlyPurchases,

                    (
                        SELECT ISNULL(SUM(TotalWorker), 0)
                        FROM   DailyAttendance
                        WHERE  MONTH(Date) = @Month
                          AND  YEAR(Date)  = @Year
                          AND  (@SiteId = 0 OR SiteId = @SiteId)
                    ) AS MonthlyAttendance";

            return connection.QuerySingleOrDefault<MonthlyActivityStats>(
                sql, new { SiteId = siteId, Month = month, Year = year }
            ) ?? new MonthlyActivityStats();
        }
    }
}

