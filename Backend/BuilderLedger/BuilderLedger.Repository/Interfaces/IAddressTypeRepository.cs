using BuilderLedger.Core.DataModels;

namespace BuilderLedger.Repository.Interfaces
{
    public interface IAddressTypeRepository
    {
        public List<AddressType> GetAll();
    }
}
