using BuilderLedger.Core.DataModels;
using BuilderLedger.Repository.Interfaces;
using Dapper;
using System.Data;
using System.Data.SqlClient;

namespace BuilderLedger.Repository.Dapper
{
    public class MaterialPurchaseRepositoryUsingDapper : IMaterialPurchaseRepository
    {
        private readonly string _connectionString;

        public MaterialPurchaseRepositoryUsingDapper(string connectionString)
        {
            _connectionString = connectionString;
        }

        public List<MaterialPurchase> GetAll(int siteId, DateTime? DateFrom, DateTime? DateTo, int? MaterialId, int? SupplierId, int? BrandId)
        {
            using (IDbConnection connection = new SqlConnection(_connectionString))
            {
                string sqlQuery = @"SELECT MaterialPurchase.Id, 
                       Materials.Name AS MaterialName, Suppliers.Name AS SupplierName, 
                       Suppliers.PhoneNumber, Brands.Name AS BrandName, MaterialPurchase.Quantity, 
                       MaterialPurchase.UnitOfMeasure, Materials.UnitPrice, MaterialPurchase.Date,
                       MaterialPurchase.MaterialCost, MaterialPurchase.DeliveryCharge
                       FROM 
                           MaterialPurchase
                       INNER 
                           JOIN Materials ON MaterialPurchase.MaterialId = Materials.Id                
                       INNER 
                           JOIN Suppliers ON MaterialPurchase.SupplierId = Suppliers.Id                    
                       INNER 
                           JOIN Brands ON MaterialPurchase.BrandId = Brands.Id
                       WHERE 
                           (@DateFrom IS NULL OR MaterialPurchase.Date >= @DateFrom) 
                           AND (@DateTo IS NULL OR MaterialPurchase.Date <= @DateTo)
                           AND (@MaterialId IS NULL OR MaterialPurchase.MaterialId = @MaterialId)
                           AND (@SupplierId IS NULL OR MaterialPurchase.SupplierId = @SupplierId)
                           AND (@BrandId IS NULL OR MaterialPurchase.BrandId = @BrandId)
                       ORDER BY MaterialPurchase.Date DESC";

                return connection.Query<MaterialPurchase>(sqlQuery,
                       new { DateFrom, DateTo, MaterialId, SupplierId, BrandId }).ToList();
            }
        }

        public int Create(MaterialPurchase materialPurchase)
        {
            using (IDbConnection connection = new SqlConnection(_connectionString))
            {
                string sqlQuery = @"INSERT INTO MaterialPurchase
                       (MaterialId, SupplierId, SiteId, PhoneNumber, BrandId, Quantity, UnitOfMeasure, Date, MaterialCost, DeliveryCharge)
                       VALUES
                       (@MaterialId, @SupplierId, @siteId, @PhoneNumber, @BrandId, @Quantity, @UnitOfMeasure, @Date, @MaterialCost, @DeliveryCharge)";

                return connection.Execute(sqlQuery, materialPurchase);
            }
        }

        public void Delete(int id)
        {
            using (IDbConnection connection = new SqlConnection(_connectionString))
            {
                string sqlQuery = "DELETE FROM MaterialPurchase WHERE Id = @Id";
                // Executes the delete query
                connection.Execute(sqlQuery, new { Id = id });
            }
        }
    }
}

