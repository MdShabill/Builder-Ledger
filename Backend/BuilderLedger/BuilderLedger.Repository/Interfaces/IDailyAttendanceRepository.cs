using BuilderLedger.Core.DataModels;

namespace BuilderLedger.Repository.Interfaces
{
    public interface IDailyAttendanceRepository
    {
        public List<DailyAttendance> GetAll(int siteId, DateTime? DateFrom, DateTime? DateTo);
        public int Create(DailyAttendance dailyAttendance);
        public void Delete(int serviceProviderId);
    }
}
