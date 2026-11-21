namespace BuilderLedger.API.DTO
{
    public class SiteQuery
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string SortColumn { get; set; } = "Id";
        public string SortOrder { get; set; } = "DESC";
        public string? SearchKeyword { get; set; }
        public int StatusId { get; set; } = 0;
    }
}
