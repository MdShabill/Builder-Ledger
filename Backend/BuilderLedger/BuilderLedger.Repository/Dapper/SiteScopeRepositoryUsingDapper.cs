using BuilderLedger.Core.DataModels;
using BuilderLedger.Repository.Interfaces;
using Dapper;
using System.Data.SqlClient;

namespace BuilderLedger.Repository.Dapper
{
    public class SiteScopeRepositoryUsingDapper : ISiteScopeRepository
    {
        private readonly string _connectionString;
        public SiteScopeRepositoryUsingDapper(string connectionString)
        {
            _connectionString = connectionString;
        }
        public List<SiteScope> Get(int siteId)
        {
            using SqlConnection connection = new(_connectionString);

            var result = connection.Query<SiteScope>(@"
                SELECT
                    SiteScope.Id, SiteScope.SiteId, SiteScope.SiteScopeId,
                    SiteScopeMaster.ScopeName, SiteScope.ScopeStatusId,
                    ScopeStatus.StatusName,SiteScope.CompletedDate,
                    SiteScope.Remarks
                FROM
                    SiteScope
                JOIN 
                    SiteScopeMaster ON SiteScope.SiteScopeId = SiteScopeMaster.Id
                JOIN 
                    ScopeStatus ON SiteScope.ScopeStatusId = ScopeStatus.Id
                WHERE
                    SiteScope.SiteId = @SiteId
                ORDER 
                    BY SiteScopeMaster.Id", new { SiteId = siteId }).ToList();

            return result;
        }

        public List<SiteScopeStatus> GetAllStatuses()
        {
            using SqlConnection connection = new(_connectionString);

            var result = connection.Query<SiteScopeStatus>("SELECT Id, StatusName FROM ScopeStatus ORDER BY Id").ToList();
            return result;

        }

        public void SaveScopes(int siteId, List<(int scopeMasterId, int statusId, string? remarks)> scopes)
        {
            using SqlConnection connection = new(_connectionString);

            connection.Open();
            using SqlTransaction sqlTransaction = connection.BeginTransaction();

            connection.Execute("DELETE FROM SiteScope WHERE SiteId = @SiteId", new { SiteId = siteId }, sqlTransaction);


            // New scopes insert
            foreach (var (scopeMasterId, statusId, remarks) in scopes)
            {
                connection.Execute(@"
                    INSERT INTO SiteScope
                        (SiteId, SiteScopeId, ScopeStatusId, Remarks)
                    VALUES
                        (@SiteId, @SiteScopeId, @ScopeStatusId, @Remarks)",
                new { SiteId = siteId, SiteScopeId = scopeMasterId, ScopeStatusId = statusId, Remarks = remarks }, sqlTransaction);
            }
            sqlTransaction.Commit();
        }

        public void UpdateScopeStatus(int id, int scopeStatusId, string? remarks, DateTime? completedDate)
        {
            using SqlConnection connection = new(_connectionString);

            connection.Execute(@"UPDATE SiteScope
                SET ScopeStatusId = @ScopeStatusId,
                    Remarks = @Remarks,
                    CompletedDate = @CompletedDate
                WHERE 
                    Id = @Id", new
            {
                Id = id,
                ScopeStatusId = scopeStatusId,
                Remarks = remarks,
                CompletedDate = completedDate
            });
        }
    }
}

