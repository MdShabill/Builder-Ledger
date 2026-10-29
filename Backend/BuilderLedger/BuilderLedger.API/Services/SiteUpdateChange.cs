namespace BuilderLedger.API.Services
{
    public class SiteUpdateChange
    {
        public string FieldName { get; set; } = string.Empty;
        public string OldValue { get; set; } = string.Empty;
        public string NewValue { get; set; } = string.Empty;
    }
}
