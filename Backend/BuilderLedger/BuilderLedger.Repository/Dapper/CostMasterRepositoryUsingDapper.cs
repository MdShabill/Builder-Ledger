using BuilderLedger.Core.DataModels;
using BuilderLedger.Repository.Interfaces;
using Dapper;
using System.Data;
using System.Data.SqlClient;

namespace BuilderLedger.Repository.Dapper
{
    public partial class CostMasterRepositoryUsingDapper : ICostMasterRepository
    {
        private readonly string _connectionString;

        public CostMasterRepositoryUsingDapper(string connectionString)
        {
            _connectionString = connectionString;
        }

        public List<CostMaster> GetByServiceType(int serviceTypeId, int siteId)
        {
            using (IDbConnection connection = new SqlConnection(_connectionString))
            {
                string sqlQuery = @"
                       SELECT 
                           CostMaster.Id, CostMaster.ServiceTypeId, 
                           ServiceTypes.Name, CostMaster.Cost, CostMaster.Date, CostMaster.SiteId
                       FROM 
                           CostMaster
                       JOIN 
                           ServiceTypes ON CostMaster.ServiceTypeId = ServiceTypes.Id
                       WHERE 
                           CostMaster.ServiceTypeId = @serviceTypeId
                       AND 
                          CostMaster.SiteId = @siteId
                       ORDER 
                          BY CostMaster.Date DESC";
                return connection.Query<CostMaster>(sqlQuery, new { serviceTypeId, siteId }).ToList();
            }
        }

        public CostMaster GetActiveCostDetail(int serviceTypeId, int siteId)
        {
            using (IDbConnection connection = new SqlConnection(_connectionString))
            {
                string sqlQuery = @"
                       SELECT TOP 1 
                           CostMaster.ServiceTypeId, ServiceTypes.Name, 
                           CostMaster.Cost, CostMaster.Date, CostMaster.SiteId
                       FROM 
                           CostMaster 
                       JOIN 
                           ServiceTypes ON CostMaster.ServiceTypeId = ServiceTypes.Id 
                       WHERE 
                           CostMaster.ServiceTypeId = @serviceTypeId 
                         AND 
                           CostMaster.SiteId = @siteId
                         AND 
                           CostMaster.Date <= @currentDate 
                       ORDER 
                           BY CostMaster.Date DESC";
                return connection.QueryFirstOrDefault<CostMaster>(sqlQuery,
                    new { serviceTypeId, siteId, currentDate = DateTime.Now }) ?? new CostMaster();
            }
        }

        public CostMaster GetById(int id, int siteId)
        {
            using (IDbConnection connection = new SqlConnection(_connectionString))
            {
                string sqlQuery = @"
                       SELECT 
                           CostMaster.Id, CostMaster.ServiceTypeId, 
                           ServiceTypes.Name, CostMaster.Cost, CostMaster.Date, CostMaster.SiteId
                       FROM 
                           CostMaster
                       JOIN 
                           ServiceTypes ON CostMaster.ServiceTypeId = ServiceTypes.Id
                       WHERE 
                           CostMaster.Id = @id
                       AND 
                          CostMaster.SiteId = @siteId";
                return connection.QueryFirstOrDefault<CostMaster>(sqlQuery, new { id, siteId });
            }
        }

        public int Create(CostMaster costMaster)
        {
            using (IDbConnection connection = new SqlConnection(_connectionString))
            {
                string insertQuery = @"
                       INSERT INTO 
                            CostMaster (ServiceTypeId, Cost, Date, SiteId)
                       VALUES 
                            (@ServiceTypeId, @Cost, @Date, @SiteId);

                       SELECT CAST(SCOPE_IDENTITY() AS INT);";
                return connection.ExecuteScalar<int>(insertQuery, costMaster);
            }
        }

        public int Update(CostMaster costMaster)
        {
            using (IDbConnection connection = new SqlConnection(_connectionString))
            {
                string updateQuery = @"
                       UPDATE CostMaster SET
                           ServiceTypeId = @ServiceTypeId,
                           Cost = @Cost,
                           Date = @Date
                       WHERE Id = @Id
                         AND SiteId = @SiteId";
                return connection.Execute(updateQuery, costMaster);
            }
        }

        public void Delete(int id, int siteId)
        {
            using (IDbConnection connection = new SqlConnection(_connectionString))
            {
                string deleteQuery = @"DELETE FROM CostMaster WHERE Id = @id AND SiteId = @siteId";
                connection.Execute(deleteQuery, new { id, siteId });
            }
        }
     }
}

