namespace BuilderLedger.API.DTO
{
    public class UpdateScopeStatusDTO
    {
        public int SiteScopeId { get; set; }
        public int ScopeStatusId { get; set; }
        public string? Remarks { get; set; }
    }
}
