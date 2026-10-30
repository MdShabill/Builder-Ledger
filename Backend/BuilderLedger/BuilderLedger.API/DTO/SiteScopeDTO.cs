namespace BuilderLedger.API.DTO
{
    public class SiteScopeDTO
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
