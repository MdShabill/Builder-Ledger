namespace BuilderLedger.API.Services
{
    public class EmailSettings
    {
        public string SmtpHost { get; set; } = string.Empty;

        public int SmtpPort { get; set; }

        public string SenderEmail { get; set; } = string.Empty;

        public string SenderName { get; set; } = string.Empty;

        public string SenderPassword { get; set; } = string.Empty;

        public string ToEmail { get; set; } = string.Empty;

        public string ToName { get; set; } = string.Empty;

        public string ApplicationBaseUrl { get; set; } = string.Empty;
    }
}
