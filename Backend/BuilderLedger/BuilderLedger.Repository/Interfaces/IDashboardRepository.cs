using BuilderLedger.Core.DataModels;

namespace BuilderLedger.Repository.Interfaces
{
    public interface IDashboardRepository
    {
        DashboardStats GetStats(int siteId);
        List<SiteScope> GetScopeItems(int siteId);

        MonthlyActivityStats GetMonthlyActivity(int siteId, int month, int year);
    }
}
