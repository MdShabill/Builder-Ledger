using BuilderLedger.Core.DataModels;
using BuilderLedger.Core.Enums;

namespace BuilderLedger.Repository.Interfaces
{
    public interface ISiteRepository
    {
        public List<Site> GetAll();
        public List<Site> GetSites(string? search, int? statusId, DateTime? fromDate, DateTime? toDate, decimal? budgetFrom, decimal? budgetTo);
        public Site GetSiteById(int id);
        public int Update(Site site);
        public int Create(Site site);
        public void Delete(int siteId);
        public List<int> GetServiceProviderIdsByTypes(int siteId, List<ServiceTypes> serviceTypes);
        public void AddAOrUpdateSiteServiceProviderBridge(int siteId, ServiceTypes serviceType, List<int> serviceProviderIds);
    }
}
