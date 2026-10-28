using BuilderLedger.Core.DataModels;
using BuilderLedger.Repository.Interfaces;
using Dapper;
using System.Data;
using System.Data.SqlClient;

namespace BuilderLedger.Repository.Dapper
{
    public class AddressTypeRepositoryUsingDapper : IAddressTypeRepository
    {
        private readonly string _connectionString;

        public AddressTypeRepositoryUsingDapper(string connectionString)
        {
            _connectionString = connectionString;
        }

        public List<AddressType> GetAll()
        {
            using (IDbConnection connection = new SqlConnection(_connectionString))
            {
                string sqlQuery = "Select Id, Name From AddressTypes";

                List<AddressType> result = connection.Query<AddressType>(sqlQuery).ToList();
                return result;
            }
        }
    }
}
