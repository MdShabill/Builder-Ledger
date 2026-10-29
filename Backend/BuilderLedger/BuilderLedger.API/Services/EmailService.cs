using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using System.Diagnostics;
using System.Net;
using System.Net.Mail;

namespace BuilderLedger.API.Services
{
    public class EmailService : IEmailService
    {
        private readonly EmailSettings _emailSettings;
        private readonly ILogger<EmailService> _logger;

        public EmailService(
            IOptions<EmailSettings> emailSettings,
            ILogger<EmailService> logger)
        {
            _emailSettings = emailSettings.Value;
            _logger = logger;
        }

        public async Task SendNewSiteNotificationAsync(
            int siteId, string siteName, string contactName,
            string contactNumber, string siteStatus,
            decimal? expectedBudget, DateTime? startedDate,
            DateTime? expectedCompletionDate, string siteAddress,
            string workScope, string note, string addedByName)
        {
            Stopwatch emailTimer = Stopwatch.StartNew();

            _logger.LogInformation("Email: New Site Notification | Invoked");

            try
            {
                string safeRecipientName = WebUtility.HtmlEncode(
                        string.IsNullOrWhiteSpace(_emailSettings.ToName)
                            ? "User" : _emailSettings.ToName);

                string safeSiteName = WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(siteName)
                            ? "Not Provided" : siteName);

                string safeContactName = WebUtility.HtmlEncode(
                        string.IsNullOrWhiteSpace(contactName)
                            ? "Not Provided" : contactName);

                string safeContactNumber = WebUtility.HtmlEncode(
                        string.IsNullOrWhiteSpace(contactNumber)
                            ? "Not Provided" : contactNumber);

                string safeSiteStatus = WebUtility.HtmlEncode(
                        string.IsNullOrWhiteSpace(siteStatus)
                            ? "Not Provided" : siteStatus);

                string safeSiteAddress = WebUtility.HtmlEncode(
                        string.IsNullOrWhiteSpace(siteAddress)
                            ? "Not Provided" : siteAddress);

                string safeWorkScope = WebUtility.HtmlEncode(
                        string.IsNullOrWhiteSpace(workScope)
                            ? "Not Provided" : workScope);

                string safeNote = WebUtility.HtmlEncode(
                        string.IsNullOrWhiteSpace(note)
                            ? "No additional note provided." : note);

                string safeAddedByName = WebUtility.HtmlEncode(
                        string.IsNullOrWhiteSpace(addedByName)
                            ? "System" : addedByName);

                string formattedBudget = expectedBudget.HasValue
                        ? $"₹{expectedBudget.Value:N0}" : "Not Provided";

                string formattedStartedDate = startedDate.HasValue
                        ? startedDate.Value.ToString("d MMMM yyyy") : "Not Provided";

                string formattedCompletionDate = expectedCompletionDate.HasValue
                        ? expectedCompletionDate.Value.ToString("d MMMM yyyy") : "Not Provided";

                string subject = $"New Construction Site Added - {siteName}";

                string body = $"""
                    <!DOCTYPE html>
                    <html>
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        </head>

                    <body style="margin:0;
                                 padding:0;
                                 background-color:#f5f3ee;
                                 font-family:Arial, Helvetica, sans-serif;
                                 color:#333333;">

                        <table width="100%"
                               cellpadding="0"
                               cellspacing="0"
                               border="0"
                               style="background-color:#f5f3ee;
                                      padding:30px 15px;">

                            <tr>
                                <td align="center">

                                    <table width="100%"
                                           cellpadding="0"
                                           cellspacing="0"
                                           border="0"
                                           style="max-width:650px;
                                                  background-color:#ffffff;
                                                  border-radius:8px;
                                                  overflow:hidden;">

                                        <!-- Header -->
                                        <tr>
                                            <td style="background-color:#1a2e44;
                                                       padding:24px 30px;
                                                       color:#ffffff;">

                                                <div style="font-size:22px;
                                                            font-weight:bold;">
                                                    BUILDER LEDGER
                                                </div>

                                                <div style="font-size:13px;
                                                            margin-top:5px;
                                                            color:#d9e0e7;">
                                                    Construction Management System
                                                </div>

                                            </td>
                                        </tr>

                                        <!-- Content -->
                                        <tr>
                                            <td style="padding:30px;">

                                                <p style="margin-top:0;
                                                          font-size:15px;">
                                                    Hello <strong>{safeRecipientName}</strong>,
                                                </p>

                                                <p style="font-size:15px;
                                                          line-height:1.6;">
                                                    A new construction site has
                                                    been added to Builder Ledger.
                                                </p>

                                                <h2 style="font-size:20px;
                                                           color:#1a2e44;
                                                           margin-top:25px;">
                                                    New Site: {safeSiteName}
                                                </h2>

                                                <!-- Site Details -->
                                                <table width="100%"
                                                       cellpadding="0"
                                                       cellspacing="0"
                                                       border="0"
                                                       style="border-collapse:collapse;
                                                              margin-top:15px;">

                                                    <tr>
                                                        <td style="padding:9px 0;
                                                                   font-weight:bold;
                                                                   width:45%;
                                                                   border-bottom:1px solid #eeeeee;">
                                                            Contact Person
                                                        </td>

                                                        <td style="padding:9px 0;
                                                                   border-bottom:1px solid #eeeeee;">
                                                            {safeContactName}
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td style="padding:9px 0;
                                                                   font-weight:bold;
                                                                   border-bottom:1px solid #eeeeee;">
                                                            Contact Number
                                                        </td>

                                                        <td style="padding:9px 0;
                                                                   border-bottom:1px solid #eeeeee;">
                                                            {safeContactNumber}
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td style="padding:9px 0;
                                                                   font-weight:bold;
                                                                   border-bottom:1px solid #eeeeee;">
                                                            Status
                                                        </td>

                                                        <td style="padding:9px 0;
                                                                   border-bottom:1px solid #eeeeee;">
                                                            {safeSiteStatus}
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td style="padding:9px 0;
                                                                   font-weight:bold;
                                                                   border-bottom:1px solid #eeeeee;">
                                                            Expected Budget
                                                        </td>

                                                        <td style="padding:9px 0;
                                                                   border-bottom:1px solid #eeeeee;">
                                                            {formattedBudget}
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td style="padding:9px 0;
                                                                   font-weight:bold;
                                                                   border-bottom:1px solid #eeeeee;">
                                                            Start Date
                                                        </td>

                                                        <td style="padding:9px 0;
                                                                   border-bottom:1px solid #eeeeee;">
                                                            {formattedStartedDate}
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td style="padding:9px 0;
                                                                   font-weight:bold;
                                                                   border-bottom:1px solid #eeeeee;">
                                                            Expected Completion
                                                        </td>

                                                        <td style="padding:9px 0;
                                                                   border-bottom:1px solid #eeeeee;">
                                                            {formattedCompletionDate}
                                                        </td>
                                                    </tr>

                                                </table>

                                                <!-- Address -->
                                                <h3 style="font-size:16px;
                                                           color:#1a2e44;
                                                           margin-top:28px;
                                                           margin-bottom:8px;">
                                                    Site Address
                                                </h3>

                                                <p style="margin-top:0;
                                                          line-height:1.6;">
                                                    {safeSiteAddress}
                                                </p>

                                                <!-- Work Scope -->
                                                <h3 style="font-size:16px;
                                                           color:#1a2e44;
                                                           margin-top:25px;
                                                           margin-bottom:8px;">
                                                    Work Scope
                                                </h3>

                                                <p style="margin-top:0;
                                                          line-height:1.6;">
                                                    {safeWorkScope}
                                                </p>

                                                <!-- Note -->
                                                <h3 style="font-size:16px;
                                                           color:#1a2e44;
                                                           margin-top:25px;
                                                           margin-bottom:8px;">
                                                    Note
                                                </h3>

                                                <p style="margin-top:0;
                                                          line-height:1.6;">
                                                    {safeNote}
                                                </p>

                                                <p style="margin-top:25px;">
                                                    <strong>Added By:</strong>
                                                    {safeAddedByName}
                                                </p>

                                                <!-- Button -->
                                                <table cellpadding="0"
                                                       cellspacing="0"
                                                       border="0"
                                                       style="margin-top:25px;">

                                                    <tr>
                                                        <td style="background-color:#f0a500;
                                                                   border-radius:5px;
                                                                   padding:12px 22px;">

                                                            <a href="#"
                                                               style="color:#ffffff;
                                                                      text-decoration:none;
                                                                      font-weight:bold;
                                                                      font-size:14px;">
                                                                View Site Details
                                                            </a>

                                                        </td>
                                                    </tr>

                                                </table>

                                                <p style="font-size:13px;
                                                          color:#666666;
                                                          line-height:1.6;
                                                          margin-top:25px;">
                                                    The site has been successfully
                                                    added to Builder Ledger.
                                                </p>

                                                <p style="font-size:14px;
                                                          line-height:1.6;">
                                                    Regards,<br>
                                                    <strong>Builder Ledger</strong><br>
                                                    Construction Management System
                                                </p>

                                            </td>
                                        </tr>

                                    </table>

                                </td>
                            </tr>

                        </table>

                    </body>
                    </html>
                    """;

                var message = new MimeMessage();

                message.From.Add(new MailboxAddress(
                    _emailSettings.SenderName, _emailSettings.SenderEmail));

                message.To.Add(new MailboxAddress(
                    _emailSettings.ToName, _emailSettings.ToEmail));

                message.Subject = subject;

                message.Body = new BodyBuilder
                {
                    HtmlBody = body
                }.ToMessageBody();

                using var smtp = new MailKit.Net.Smtp.SmtpClient();

                await smtp.ConnectAsync(
                    _emailSettings.SmtpHost, _emailSettings.SmtpPort, SecureSocketOptions.StartTls);

                await smtp.AuthenticateAsync(
                    _emailSettings.SenderEmail, _emailSettings.SenderPassword);

                await smtp.SendAsync(message);

                await smtp.DisconnectAsync(true);

                emailTimer.Stop();

                _logger.LogInformation("Email: New Site Notification | Sent | To: {ToEmail} | Time: {ElapsedMs} ms",
                    _emailSettings.ToEmail, emailTimer.ElapsedMilliseconds);
            }
            catch (Exception ex)
            {
                emailTimer.Stop();

                _logger.LogError(ex, "Email: New Site Notification | Failed | To: {ToEmail} | Time: {ElapsedMs} ms",
                    _emailSettings.ToEmail, emailTimer.ElapsedMilliseconds);

                throw;
            }
        }
    }
}
