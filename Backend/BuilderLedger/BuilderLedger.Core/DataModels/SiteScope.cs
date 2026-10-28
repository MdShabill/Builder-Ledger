namespace BuilderLedger.Core.DataModels
{
    public class SiteScope
    {
        public int Id { get; set; }
        public int SiteId { get; set; }
        public int SiteScopeId { get; set; }
        public string? ScopeName { get; set; }
        public int ScopeStatusId { get; set; }
        public string? StatusName { get; set; }
        public DateTime? CompletedDate { get; set; }
        public string? Remarks { get; set; }
    }
}
