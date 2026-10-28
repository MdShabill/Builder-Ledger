using BuilderLedger.Core.DataModels;

namespace BuilderLedger.Repository.Interfaces
{
    public interface ICountryRepository
    {
        public List<Country> GetAllCountries();
    }
}
