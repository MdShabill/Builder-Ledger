namespace BuilderLedger.API.DTO
{
    public class SiteMasterDataDTO
    {
        public List<MasterDataDTO> Statuses = new();
        public List<MasterDataDTO> AddressTypes = new();
        public List<MasterDataDTO> Countries = new();
        public List<MasterDataDTO> ScopeMasters = new();
        public List<MasterDataDTO> ScopeStatuses = new();
    }
}
