using BuilderLedger.Core.DataModels;
using BuilderLedger.Repository.Interfaces;
using Dapper;
using System.Data;
using System.Data.SqlClient;

namespace BuilderLedger.Repository.Dapper
{
    public class BrandRepositoryUsingDapper : IBrandRepository
    {
        private readonly string _connectionString;

        public BrandRepositoryUsingDapper(string connectionString)
        {
            _connectionString = connectionString;
        }

        public List<Brand> GetAll()
        {
            using (IDbConnection connection = new SqlConnection(_connectionString))
            {
                string sqlQuery = "SELECT Id, Name FROM Brands";
                return connection.Query<Brand>(sqlQuery).ToList();
            }
        }
    }
}
