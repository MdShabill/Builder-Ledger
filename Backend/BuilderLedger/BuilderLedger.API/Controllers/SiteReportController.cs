using BuilderLedger.API.APIControllers.ApiEndpoints;
using BuilderLedger.API.Services;
using BuilderLedger.API.ViewModels;
using Microsoft.AspNetCore.Mvc;

namespace BuilderLedger.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SiteReportController : ControllerBase
    {
        private readonly SiteReportPdfService _pdfService;

        public SiteReportController(SiteReportPdfService pdfService)
        {
            _pdfService = pdfService;
        }

        [HttpPost(SiteReportAPIEnpoints.GeneratePdf)]
        public async Task<IActionResult> GeneratePdf([FromBody] GeneratePdfRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Html))
                return BadRequest("HTML content is required.");

            var pdfBytes = await _pdfService.GeneratePdfAsync(request.Html);

            var fileName = string.IsNullOrWhiteSpace(request.FileName) ? "site-report.pdf" : request.FileName;

            if (!fileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
                fileName += ".pdf";

            return File(pdfBytes, "application/pdf", fileName);
        }
    }
}
