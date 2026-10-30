namespace BuilderLedger.API.DTO
{
    public class GeneratePdfRequestDTO
    {
        public string Html { get; set; } = string.Empty;

        public string FileName { get; set; } = "site-report.pdf";
    }
}
