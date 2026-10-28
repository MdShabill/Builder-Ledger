using BuilderLedger.Core.DataModels;

namespace BuilderLedger.Repository.Interfaces
{
    public interface ISupplierRepository
    {
        public List<Supplier> GetAll();
    }
}
