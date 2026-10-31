namespace BuilderLedger.API.DTO
{
    public class SiteMasterDataDTO
    {
        public List<MasterDataDTO> Statuses { get; set; } = new();
        public List<MasterDataDTO> AddressTypes { get; set; } = new();
        public List<MasterDataDTO> Countries { get; set; } = new();
        public List<MasterDataDTO> ScopeMasters { get; set; } = new();
        public List<MasterDataDTO> ScopeStatuses { get; set; } = new ();
    }
}
