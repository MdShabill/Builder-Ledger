namespace BuilderLedger.API.Services
{
    public interface IEmailService
    {
        Task SendNewSiteNotificationAsync(
            int siteId,
            string siteName,
            string contactName,
            string contactNumber,
            string siteStatus,
            decimal? expectedBudget,
            DateTime? startedDate,
            DateTime? expectedCompletionDate,
            string siteAddress,
            string workScope,
            string note,
            string addedByName);
    }
}
