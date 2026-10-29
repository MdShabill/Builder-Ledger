using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using System.Net;

namespace BuilderLedger.API.Services
{
    public class SiteUpdateEmailService
    {
        private readonly EmailSettings _settings;
        private readonly ILogger<SiteUpdateEmailService> _logger;

        public SiteUpdateEmailService(IOptions<EmailSettings> settings, ILogger<SiteUpdateEmailService> logger)
        {
            _settings = settings.Value;
            _logger = logger;
        }

        public async Task SendAsync(string siteName, string updatedBy, DateTime updatedAt, List<SiteUpdateChange> changes)
        {
            // No changes means no email is required.
            if (changes == null || changes.Count == 0)
                return;

            _logger.LogInformation("API Action: SiteUpdateEmailService | Invoked: {InvokedAt}", DateTime.Now.ToString("HH:mm:ss.fff"));
            try
            {
                string safeSiteName = WebUtility.HtmlEncode(siteName);
                string safeUpdatedBy = WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(updatedBy) ? "System" : updatedBy);

                string safeRecipient = WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(_settings.ToName) ? "User" : _settings.ToName);

                // Create table rows for changed fields.
                string rows = "";

                foreach (var change in changes)
                {
                    rows += $"""
                        <tr>
                            <td style="padding:10px;border-bottom:1px solid #eeeeee;">
                                <strong>{WebUtility.HtmlEncode(change.FieldName)}</strong>
                            </td>
                            <td style="padding:10px;border-bottom:1px solid #eeeeee;">
                                {WebUtility.HtmlEncode(change.OldValue ?? "")}
                            </td>
                            <td style="padding:10px;border-bottom:1px solid #eeeeee;">
                                {WebUtility.HtmlEncode(change.NewValue ?? "")}
                            </td>
                        </tr>
                        """;
                }

                // Create the email HTML.
                string body = $"""
                    <!DOCTYPE html>
                    <html>
                    <body style="margin:0;padding:24px;background:#f5f3ee;
                                 font-family:Arial,Helvetica,sans-serif;color:#333;">

                        <table width="100%" cellpadding="0" cellspacing="0"
                               style="max-width:700px;margin:auto;background:#ffffff;">

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

                                    <h3 style="color:#1a2e44;">
                                        Construction Site Updated
                                    </h3>

                                    <p>
                                        Important changes were made to
                                        <strong>{safeSiteName}</strong>.
                                    </p>

                                    <table width="100%" cellpadding="0" cellspacing="0"
                                           style="border-collapse:collapse;font-size:14px;">

                                        <tr style="background:#f0a500;color:#ffffff;">
                                            <th align="left" style="padding:10px;">Field</th>
                                            <th align="left" style="padding:10px;">Previous Value</th>
                                            <th align="left" style="padding:10px;">New Value</th>
                                        </tr>

                                        {rows}

                                    </table>

                                    <p style="margin-top:24px;">
                                        <strong>Updated By:</strong> {safeUpdatedBy}<br>
                                        <strong>Updated At:</strong>
                                        {updatedAt:dd MMMM yyyy, hh:mm tt}
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

                // Prepare the email.
                var message = new MimeMessage();

                message.From.Add(new MailboxAddress(_settings.SenderName, _settings.SenderEmail));

                message.To.Add(new MailboxAddress(_settings.ToName, _settings.ToEmail));

                message.Subject = $"Site Updated - {siteName}";
                message.Body = new BodyBuilder { HtmlBody = body }.ToMessageBody();

                // Connect to SMTP and send the email.
                using var smtp = new SmtpClient();

                await smtp.ConnectAsync(_settings.SmtpHost, _settings.SmtpPort, SecureSocketOptions.StartTls);

                await smtp.AuthenticateAsync(_settings.SenderEmail, _settings.SenderPassword);

                await smtp.SendAsync(message);
                await smtp.DisconnectAsync(true);

                _logger.LogInformation("API Action: SiteUpdateEmailService | Invoked: {InvokedAt}" + DateTime.Now.ToString("HH:mm:ss.fff"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send update email for site {SiteName}", siteName);

                throw;
            }
        }
    }
}
