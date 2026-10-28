using BuilderLedger.Core.DataModels;
using BuilderLedger.Repository.Interfaces;
using Dapper;
using System.Data;
using System.Data.SqlClient;

namespace BuilderLedger.Repository.Dapper
{
    public class SupplierRepositoryUsingDapper : ISupplierRepository
    {
        private readonly string _connectionString;

        public SupplierRepositoryUsingDapper(string connectionString)
        {
            _connectionString = connectionString;
        }

        public List<Supplier> GetAll()
        {
            using (IDbConnection connection = new SqlConnection(_connectionString))
            {
                string sqlQuery = "SELECT Id, Name FROM Suppliers";
                return connection.Query<Supplier>(sqlQuery).ToList();
            }
        }
    }
}

