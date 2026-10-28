using BuilderLedger.Core.Enums;

namespace BuilderLedger.Core.DataModels
{
    public class ServiceProviderName
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int ServiceTypeId { get; set; }
    }

    public class ServiceProvider
    {
        public int ServiceProviderId { get; set; }
        public string ServiceProviderName { get; set; }
        public int ServiceTypeId { get; set; }
        public string ServiceTypes { get; set; }
        public GenderTypes Gender { get; set; }
        public DateTime DOB { get; set; }
        public string? ImageName { get; set; }
        public string MobileNumber { get; set; }
        public string ReferredBy { get; set; }

        public string AddressLine1 { get; set; }
        public int AddressTypeId { get; set; }
        public string AddressTypes { get; set; }
        public int CountryId { get; set; }
        public string CountryName { get; set; }
        public int PinCode { get; set; }
    }
}
