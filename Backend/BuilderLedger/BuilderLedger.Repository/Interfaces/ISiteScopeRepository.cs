using BuilderLedger.Core.DataModels;

namespace BuilderLedger.Repository.Interfaces
{
    public interface ISiteScopeRepository
    {
        List<SiteScope> Get(int siteId);

        //This is how we use overloading 
        //List<SiteScope> Get(string siteName);
        //List<SiteScope> Get(SiteStatus status);

        List<SiteScopeStatus> GetAllStatuses();
        void SaveScopes(int siteId, List<(int scopeMasterId, int statusId, string? remarks)> scopes);
        void UpdateScopeStatus(int id, int scopeStatusId, string? remarks, DateTime? completedDate);
    }
}
