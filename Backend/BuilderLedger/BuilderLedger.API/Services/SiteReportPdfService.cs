using Microsoft.Playwright;

namespace BuilderLedger.API.Services
{
    public class SiteReportPdfService : IHostedService, IAsyncDisposable
    {
        private IPlaywright? _playwright;
        private IBrowser? _browser;
        private IBrowserContext? _context;

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            _playwright = await Playwright.CreateAsync();

            _browser = await _playwright.Chromium.LaunchAsync(
                    new BrowserTypeLaunchOptions
                    {
                        Headless = true
                    });

            _context = await _browser.NewContextAsync(
                    new BrowserNewContextOptions
                    {
                        ViewportSize =
                        new ViewportSize
                        {
                            Width = 1200,
                            Height = 800
                        }
                    });
        }

        public async Task<byte[]> GeneratePdfAsync(string html)
        {
            if (_context == null)
            {
                throw new InvalidOperationException("PDF browser context is not initialized.");
            }

            await using var page = await _context.NewPageAsync();

            await page.SetContentAsync(html,
                new PageSetContentOptions
                {
                    WaitUntil = WaitUntilState.DOMContentLoaded
                });

            var pdfBytes = await page.PdfAsync(
                    new PagePdfOptions
                    {
                        Format = "A4",
                        PrintBackground = true,
                        PreferCSSPageSize = true,

                        Margin = new Margin
                        {
                            Top = "10mm",
                            Right = "10mm",
                            Bottom = "10mm",
                            Left = "10mm"
                        }
                    });

            return pdfBytes;
        }

        public async Task StopAsync(CancellationToken cancellationToken)
        {
            if (_context != null)
            {
                await _context.CloseAsync();
                _context = null;
            }

            if (_browser != null)
            {
                await _browser.CloseAsync();
                _browser = null;
            }

            if (_playwright != null)
            {
                _playwright.Dispose();
                _playwright = null;
            }
        }

        public async ValueTask DisposeAsync()
        {
            if (_context != null)
            {
                await _context.CloseAsync();
                _context = null;
            }

            if (_browser != null)
            {
                await _browser.CloseAsync();
                _browser = null;
            }

            _playwright?.Dispose();
            _playwright = null;
        }
    }
}
