namespace BuilderLedger.API.Controllers.APIViewModels
{
    public class SiteAPIDTO
    {
        public int Id { get; set; }

        public string? Name { get; set; }

        public string? ContactName { get; set; }

        public string? ContactNumber { get; set; }

        public DateTime? StartedDate { get; set; }

        public int SiteStatusId { get; set; }

        public string? Status { get; set; }

        public string Note { get; set; }

        public string? AddressLine1 { get; set; }

        public int? AddressTypeId { get; set; }

        public string? AddressTypes { get; set; }

        public int? CountryId { get; set; }

        public string? CountryName { get; set; }

        public int? PinCode { get; set; }

        public List<int> SelectedMasterMasonIds { get; set; } = new();

        public List<int> SelectedElectricianIds { get; set; } = new();

        public List<int> SelectedLabourIds { get; set; } = new();

        public List<int> SelectedPlumberIds { get; set; } = new();

        public List<int> SelectedPainterIds { get; set; } = new();

        public List<int> SelectedCarpenterIds { get; set; } = new();

        public List<int> SelectedTilerIds { get; set; } = new();

        public decimal? ExpectedBudget { get; set; }
        public DateTime? ExpectedCompletionDate { get; set; }

        public List<ScopeSaveItem> SelectedScopes { get; set; } = new();
    }

    public class ScopeSaveItem
    {
        public int SiteScopeMasterId { get; set; }
        public int ScopeStatusId { get; set; }
        public string? Remarks { get; set; }
    }
}
