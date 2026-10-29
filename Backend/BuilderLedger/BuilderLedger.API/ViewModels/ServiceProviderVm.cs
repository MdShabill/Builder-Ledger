using BuilderLedger.Core.Enums;
using System.Text.Json.Serialization;

namespace BuilderLedger.API.ViewModels
{
    public class ServiceProviderVm
    {
        public int ServiceProviderId { get; set; }
        public string? ServiceProviderName { get; set; }
        public int ServiceTypeId { get; set; }
        public string? ServiceTypes { get; set; }

        [JsonConverter(typeof(JsonStringEnumConverter))]
        public GenderTypes Gender { get; set; }
        public DateTime? DOB { get; set; }
        public IFormFile? ImageFile { get; set; }
        public string MobileNumber { get; set; }
        public string? ReferredBy { get; set; }

        public int SiteId { get; set; }
        public int? AddressTypeId { get; set; }
        public string? AddressTypes { get; set; }
        public int? CountryId { get; set; }
        public string? CountryName { get; set; }
        public string? AddressLine1 { get; set; }
        public int? PinCode { get; set; }
    }
}
