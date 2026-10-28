namespace BuilderLedger.Core.DataModels
{
    public class Site
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? ContactName { get; set; }
        public string? ContactNumber { get; set; }
        public DateTime? StartedDate { get; set; }
        public int? SiteStatusId { get; set; }
        public string? Status { get; set; }
        public string? Note { get; set; }

        public string? AddressLine1 { get; set; }
        public int? AddressTypeId { get; set; }
        public string? AddressTypes { get; set; }
        public int? CountryId { get; set; }
        public string? CountryName { get; set; }
        public int? PinCode { get; set; }

        public List<int>? ServiceProviderIds { get; set; }

        public decimal? ExpectedBudget { get; set; }
        public DateTime? ExpectedCompletionDate { get; set; }

    }
}
