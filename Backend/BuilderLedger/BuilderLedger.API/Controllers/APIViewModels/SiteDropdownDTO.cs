namespace BuilderLedger.API.Controllers.APIViewModels
{
    public class SiteDropdownDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class SiteMasterDataDTO
    {
        public List<SiteDropdownDTO> Statuses { get; set; } = new();
        public List<SiteDropdownDTO> AddressTypes { get; set; } = new();
        public List<SiteDropdownDTO> Countries { get; set; } = new();
        public List<SiteDropdownDTO> ScopeMasters { get; set; } = new();
        public List<SiteDropdownDTO> ScopeStatuses { get; set; } = new();
    }
}
