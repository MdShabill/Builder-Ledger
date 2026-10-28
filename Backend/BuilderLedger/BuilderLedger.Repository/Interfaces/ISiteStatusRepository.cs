using BuilderLedger.Core.DataModels;

namespace BuilderLedger.Repository.Interfaces
{
    public interface ISiteStatusRepository
    {
        public List<SiteStatus> GetAll();
    }
}
