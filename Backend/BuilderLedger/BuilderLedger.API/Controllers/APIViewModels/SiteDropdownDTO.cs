namespace BuilderLedger.API.Controllers.APIViewModels
{
    public class DropdownItemDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class SiteDropdownDTO
    {
        public List<DropdownItemDTO> Statuses { get; set; } = new();
        public List<DropdownItemDTO> AddressTypes { get; set; } = new();
        public List<DropdownItemDTO> Countries { get; set; } = new();
        public List<DropdownItemDTO> ScopeMasters { get; set; } = new();
        public List<DropdownItemDTO> ScopeStatuses { get; set; } = new();
    }
}
