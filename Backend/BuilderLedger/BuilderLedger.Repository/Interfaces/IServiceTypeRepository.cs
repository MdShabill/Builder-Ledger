using BuilderLedger.Core.DataModels;

namespace BuilderLedger.Repository.Interfaces
{
    public interface IServiceTypeRepository
    {
        public List<ServiceType> GetAll();
    }
}
