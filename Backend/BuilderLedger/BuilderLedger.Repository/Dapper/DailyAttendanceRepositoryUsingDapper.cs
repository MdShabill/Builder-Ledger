using BuilderLedger.Core.DataModels;
using BuilderLedger.Repository.Interfaces;
using Dapper;
using System.Data;
using System.Data.SqlClient;

namespace BuilderLedger.Repository.Dapper
{
    public class DailyAttendanceRepositoryUsingDapper : IDailyAttendanceRepository
    {
        private readonly string _connectionString;

        public DailyAttendanceRepositoryUsingDapper(string connectionString)
        {
            _connectionString = connectionString;
        }

        public List<DailyAttendance> GetAll(int siteId, DateTime? DateFrom, DateTime? DateTo)
        {
            using (IDbConnection connection = new SqlConnection(_connectionString))
            {
                string sqlQuery = @"
                       SELECT 
                           DailyAttendance.Date, ServiceTypes.Name, ServiceProviders.Name AS ServiceProviderName,
                           DailyAttendance.TotalWorker, DailyAttendance.AmountPerWorker, DailyAttendance.TotalAmount
                       FROM 
                           DailyAttendance
                       JOIN 
                           ServiceTypes ON DailyAttendance.ServiceTypeId = ServiceTypes.Id
                       JOIN 
                           ServiceProviders ON DailyAttendance.ServiceProviderId = ServiceProviders.Id
                       WHERE
                           (@DateFrom IS NULL OR DailyAttendance.Date >= @DateFrom) 
                           AND 
                           (@DateTo IS NULL OR DailyAttendance.Date <= @DateTo)
                       ORDER BY DailyAttendance.Date DESC";

                // Use Dapper's Query method to directly map the results to a list of DailyAttendance
                return connection.Query<DailyAttendance>(sqlQuery, new { DateFrom, DateTo }).ToList();
            }
        }

        public int Create(DailyAttendance dailyAttendance)
        {
            using (IDbConnection connection = new SqlConnection(_connectionString))
            {
                string sqlQuery = @"
                       INSERT INTO DailyAttendance
                          (Date, ServiceTypeId, ServiceProviderId, SiteId, TotalWorker, AmountPerWorker, TotalAmount)
                       VALUES
                          (@Date, @ServiceTypeId, @ServiceProviderId, @siteId, @TotalWorker, @AmountPerWorker, @TotalAmount);
                       SELECT CAST(SCOPE_IDENTITY() AS INT);";

                // Executes the SQL query and returns the newly inserted DailyAttendance Id
                return connection.ExecuteScalar<int>(sqlQuery, dailyAttendance);
            }
        }

        public void Delete(int serviceProviderId)
        {
            using (IDbConnection connection = new SqlConnection(_connectionString))
            {
                string deleteQuery = "DELETE FROM DailyAttendance WHERE ServiceProviderId = @ServiceProviderId";
                connection.Execute(deleteQuery, new { ServiceProviderId = serviceProviderId });
            }
        }
    }
}

