using BuilderLedger.Core.DataModels;
using BuilderLedger.Repository.Interfaces;
using Dapper;
using System.Data;
using System.Data.SqlClient;

namespace BuilderLedger.Repository.Dapper
{
    public class AddressRepositoryUsingDapper : IAddressRepository
    {
        private readonly string _connectionString;
        public AddressRepositoryUsingDapper(string connectionString)
        {
            _connectionString = connectionString;
        }

        public Address GetBySiteId(int siteId)
        {
            using (IDbConnection connection = new SqlConnection(_connectionString))
            {
                string query = @"SELECT TOP 1 * FROM Addresses WHERE SiteId = @SiteId";

                var result = connection.QueryFirstOrDefault<Address>(query, new { SiteId = siteId });
                return result;
            }
        }

        public void Upsert(Address address)
        {
            using (IDbConnection connection = new SqlConnection(_connectionString))
            {
                bool isServiceProvider = address.ServiceProviderId > 0;
                bool isSite = address.SiteId > 0;

                string checkQuery = @"SELECT COUNT(*) FROM Addresses 
                                      WHERE " + (isServiceProvider ? "ServiceProviderId = @Id" : "SiteId = @Id");
                int addressCount;
                addressCount = connection.ExecuteScalar<int>(checkQuery,
                      new { Id = isServiceProvider ? address.ServiceProviderId : address.SiteId });


                if (addressCount > 0)
                {
                    string updateQuery = @"UPDATE Addresses SET 
                           AddressLine1 = @AddressLine1, AddressTypeId = @AddressTypeId,
                           CountryId = @CountryId, PinCode = @PinCode
                           WHERE " + (isServiceProvider ? "ServiceProviderId = @Id" : "SiteId = @Id"
                    );

                    connection.Execute(updateQuery, new
                    {
                        address.AddressLine1,
                        address.AddressTypeId,
                        address.CountryId,
                        address.PinCode,
                        Id = isServiceProvider
                                       ? address.ServiceProviderId : address.SiteId
                    });
                }
                else
                {
                    string insertQuery = @"
                           INSERT INTO Addresses 
                               (ServiceProviderId, SiteId, AddressLine1, AddressTypeId, CountryId, PinCode)
                           VALUES 
                               (@ServiceProviderId, @SiteId, @AddressLine1, @AddressTypeId, @CountryId, @PinCode)";

                    connection.Execute(insertQuery, new
                    {
                        ServiceProviderId = isServiceProvider
                        ? (int?)address.ServiceProviderId : null,
                        SiteId = isSite ? (int?)address.SiteId : null,
                        address.AddressLine1,
                        address.AddressTypeId,
                        address.CountryId,
                        address.PinCode
                    });
                }
            }
        }

        public void Delete(int serviceProviderId, int? siteId)
        {
            using (IDbConnection connection = new SqlConnection(_connectionString))
            {
                string deleteQuery;
                object parameters;

                if (siteId.HasValue && siteId.Value > 0)
                {
                    deleteQuery = "DELETE FROM Addresses WHERE SiteId = @SiteId";
                    parameters = new { SiteId = siteId.Value };
                }
                else
                {
                    deleteQuery = "DELETE FROM Addresses WHERE ServiceProviderId = @ServiceProviderId";
                    parameters = new { ServiceProviderId = serviceProviderId };
                }
                try
                {
                    connection.Execute(deleteQuery, parameters);
                }
                catch (Exception)
                {
                    throw;
                }
            }
        }
    }
}
