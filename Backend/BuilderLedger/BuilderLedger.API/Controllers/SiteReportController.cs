using BuilderLedger.API.APIControllers.ApiEndpoints;
using BuilderLedger.API.DTO;
using BuilderLedger.API.Services;
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
        public async Task<IActionResult> GeneratePdf([FromBody] GeneratePdfRequestDTO pdfRequestDto)
        {
            if (pdfRequestDto == null || string.IsNullOrWhiteSpace(pdfRequestDto.Html))
                return BadRequest("HTML content is required.");

            var pdfBytes = await _pdfService.GeneratePdfAsync(pdfRequestDto.Html);

            var fileName = string.IsNullOrWhiteSpace(pdfRequestDto.FileName) ? "site-report.pdf" : pdfRequestDto.FileName;

            if (!fileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
                fileName += ".pdf";

            return File(pdfBytes, "application/pdf", fileName);
        }
    }
}
