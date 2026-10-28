using BuilderLedger.Core.DataModels;
using BuilderLedger.Repository.Interfaces;
using Dapper;
using System.Data;
using System.Data.SqlClient;

namespace BuilderLedger.Repository.Dapper
{
    public class MaterialRepositoryUsingDapper : IMaterialRepository
    {
        private readonly string _connectionString;

        public MaterialRepositoryUsingDapper(string connectionString)
        {
            _connectionString = connectionString;
        }

        public List<Material> GetAll()
        {
            using (IDbConnection connection = new SqlConnection(_connectionString))
            {
                string sqlQuery = "SELECT Id, Name FROM Materials";
                return connection.Query<Material>(sqlQuery).ToList();
            }
        }

        public Material GetMaterialInfo(int Id)
        {
            using (IDbConnection connection = new SqlConnection(_connectionString))
            {
                string sqlQuery = @"SELECT 
                        Id, UnitOfMeasure, UnitPrice 
                        FROM Materials
                        WHERE Id = @id";

                return connection.QueryFirstOrDefault<Material>(sqlQuery, new { id = Id }) ?? new Material();
            }
        }
    }
}

