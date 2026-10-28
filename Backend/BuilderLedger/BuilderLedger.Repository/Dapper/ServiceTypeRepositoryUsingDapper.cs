using BuilderLedger.Core.DataModels;
using BuilderLedger.Repository.Interfaces;
using Dapper;
using System.Data;
using System.Data.SqlClient;

namespace BuilderLedger.Repository.Dapper
{
    public class ServiceTypeRepositoryUsingDapper : IServiceTypeRepository
    {
        private readonly string _connectionString;

        public ServiceTypeRepositoryUsingDapper(string connectionString)
        {
            _connectionString = connectionString;
        }

        public List<ServiceType> GetAll()
        {
            using (IDbConnection connection = new SqlConnection(_connectionString))
            {
                string sqlQuery = "SELECT Id, Name FROM ServiceTypes ";
                return connection.Query<ServiceType>(sqlQuery).ToList();
            }
        }
    }
}

