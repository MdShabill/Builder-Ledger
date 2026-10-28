using BuilderLedger.Core.DataModels;

namespace BuilderLedger.Repository.Interfaces
{
    public interface ISiteScopeMasterRepository
    {
        List<SiteScopeMaster> GetAll();
    }
}
