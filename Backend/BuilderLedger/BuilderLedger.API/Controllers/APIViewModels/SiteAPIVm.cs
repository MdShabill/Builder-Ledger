namespace BuilderLedger.API.Controllers.APIViewModels
{
    public class SiteAPIVm
    {
        public int Id { get; set; }
        //public int SiteId { get; set; }
        public string? Name { get; set; }

        public string? ContactName { get; set; }
        public string? ContactNumber { get; set; }
        public DateTime StartedDate { get; set; }
        //public int SiteStatusId { get; set; }
        public string Status { get; set; }
        //public string Note { get; set; }

        //public int? ServiceProviderId { get; set; }
        //public string? DisplayName { get; set; }
        public string? AddressLine1 { get; set; }
        //public int? AddressTypeId { get; set; }
        public string? AddressTypes { get; set; }
        //public int? CountryId { get; set; }
        public string? CountryName { get; set; }
        public int? PinCode { get; set; }

        public List<int> MasterMasonIds { get; set; } = new();

        public List<int> ElectricianIds { get; set; } = new();

        public List<int> LabourIds { get; set; } = new();

        public List<int> PlumberIds { get; set; } = new();

        public List<int> PainterIds { get; set; } = new();

        public List<int> CarpenterIds { get; set; } = new();

        public List<int> TilerIds { get; set; } = new();

        public decimal? ExpectedBudget { get; set; }
        public DateTime? ExpectedCompletionDate { get; set; }
        public int? SiteStatusId { get; set; }

        public List<SiteScopeVm> Scopes { get; set; } = new();
    }

    public class SiteScopeVm
    {
        public int Id { get; set; }
        public int SiteScopeMasterId { get; set; }
        public string? ScopeName { get; set; }
        public int ScopeStatusId { get; set; }
        public string? StatusName { get; set; }
        public string? Remarks { get; set; }
        public DateTime? CompletedDate { get; set; }
    }
}
