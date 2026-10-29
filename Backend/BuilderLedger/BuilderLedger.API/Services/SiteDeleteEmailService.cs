using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using System.Net;

namespace BuilderLedger.API.Services
{
    public class SiteDeleteEmailService
    {
        private readonly EmailSettings _settings;
        private readonly ILogger<SiteDeleteEmailService> _logger;

        public SiteDeleteEmailService(IOptions<EmailSettings> settings,
            ILogger<SiteDeleteEmailService> logger)
        {
            _settings = settings.Value;
            _logger = logger;
        }

        public async Task SendAsync(int siteId, string siteName, string deletedBy, DateTime deletedAt)
        {
            _logger.LogInformation("Email: Site Delete Notification | Invoked");

            try
            {
                string safeSiteName = WebUtility.HtmlEncode(
                    string.IsNullOrWhiteSpace(siteName) ? "Not Provided" : siteName);

                string safeDeletedBy = WebUtility.HtmlEncode(
                    string.IsNullOrWhiteSpace(deletedBy) ? "System" : deletedBy);

                string safeRecipient = WebUtility.HtmlEncode(
                    string.IsNullOrWhiteSpace(_settings.ToName) ? "User" : _settings.ToName);

                string body = $"""
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                    </head>
                    <body style="margin:0;padding:24px;background:#f5f3ee;
                                 font-family:Arial,Helvetica,sans-serif;color:#333;">

                        <table width="100%" cellpadding="0" cellspacing="0"
                               style="max-width:650px;margin:auto;background:#ffffff;">

                            <tr>
                                <td style="padding:24px;background:#1a2e44;color:#ffffff;">
                                    <h2 style="margin:0;">BUILDER LEDGER</h2>
                                    <p style="margin:6px 0 0;">
                                        Construction Management System
                                    </p>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding:24px;">
                                    <p>Hello <strong>{safeRecipient}</strong>,</p>

                                    <h3 style="color:#b42318;">
                                        Construction Site Deleted
                                    </h3>

                                    <p>
                                        The following construction site has been deleted
                                        from Builder Ledger.
                                    </p>

                                    <table width="100%" cellpadding="0" cellspacing="0"
                                           style="border-collapse:collapse;font-size:14px;">

                                        <tr>
                                            <td style="padding:10px;border-bottom:1px solid #eeeeee;">
                                                <strong>Site ID</strong>
                                            </td>
                                            <td style="padding:10px;border-bottom:1px solid #eeeeee;">
                                                {siteId}
                                            </td>
                                        </tr>

                                        <tr>
                                            <td style="padding:10px;border-bottom:1px solid #eeeeee;">
                                                <strong>Site Name</strong>
                                            </td>
                                            <td style="padding:10px;border-bottom:1px solid #eeeeee;">
                                                {safeSiteName}
                                            </td>
                                        </tr>

                                        <tr>
                                            <td style="padding:10px;border-bottom:1px solid #eeeeee;">
                                                <strong>Deleted By</strong>
                                            </td>
                                            <td style="padding:10px;border-bottom:1px solid #eeeeee;">
                                                {safeDeletedBy}
                                            </td>
                                        </tr>

                                        <tr>
                                            <td style="padding:10px;border-bottom:1px solid #eeeeee;">
                                                <strong>Deleted At</strong>
                                            </td>
                                            <td style="padding:10px;border-bottom:1px solid #eeeeee;">
                                                {deletedAt:dd MMMM yyyy, hh:mm tt}
                                            </td>
                                        </tr>

                                    </table>

                                    <p style="margin-top:24px;font-size:14px;line-height:1.6;">
                                        This is an automated notification from
                                        Builder Ledger.
                                    </p>

                                    <p style="font-size:14px;line-height:1.6;">
                                        Regards,<br>
                                        <strong>Builder Ledger</strong><br>
                                        Construction Management System
                                    </p>
                                </td>
                            </tr>

                        </table>
                    </body>
                    </html>
                    """;

                MimeMessage message = new MimeMessage();

                message.From.Add(new MailboxAddress(_settings.SenderName, _settings.SenderEmail));

                message.To.Add(new MailboxAddress(_settings.ToName, _settings.ToEmail));

                message.Subject = $"Site Deleted - {siteName}";

                message.Body = new BodyBuilder
                {
                    HtmlBody = body
                }.ToMessageBody();

                using SmtpClient smtp = new SmtpClient();

                await smtp.ConnectAsync(_settings.SmtpHost, _settings.SmtpPort, SecureSocketOptions.StartTls);

                await smtp.AuthenticateAsync(_settings.SenderEmail, _settings.SenderPassword);

                await smtp.SendAsync(message);

                await smtp.DisconnectAsync(true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Email: Site Delete Notification | Failed | Site ID: {SiteId}", siteId);

            }
        }
    }
}
