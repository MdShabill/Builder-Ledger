using BuilderLedger.Core.DataModels;
using BuilderLedger.Core.Enums;
using BuilderLedger.Repository.Interfaces;
using Dapper;
using System.Data;
using System.Data.SqlClient;

namespace BuilderLedger.Repository.Dapper
{
    public class SiteRepositoryUsingDapper : ISiteRepository
    {
        private readonly string _connectionString;
        public SiteRepositoryUsingDapper(string connectionString)
        {
            _connectionString = connectionString;
        }



        public (List<Site> Sites, int TotalCount) GetAll(int pageNumber, int pageSize, string sortColumn, string sortOrder)
        {
            using (IDbConnection db = new SqlConnection(_connectionString))
            {
                int offset = (pageNumber - 1) * pageSize;

                // Allowed sorting columns
                var sortColumns = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    { "Id", "Sites.Id" }, { "Name", "Sites.Name" },
                    { "StartedDate", "Sites.StartedDate" },
                    { "ExpectedCompletionDate", "Sites.ExpectedCompletionDate" },
                    { "ExpectedBudget", "Sites.ExpectedBudget" },
                    { "Status", "SiteStatus.Status" }
                };

                if (!sortColumns.TryGetValue(sortColumn, out string? column))
                {
                    throw new ArgumentException("Invalid sorting column.");
                }

                sortOrder = sortOrder.ToUpperInvariant();

                if (sortOrder != "ASC" && sortOrder != "DESC")
                {
                    throw new ArgumentException("Invalid sorting order.");
                }

                string orderBy = column == "Sites.Id" ? $"{column} {sortOrder}" : $"{column} {sortOrder}, Sites.Id DESC";

                string query = $@"SELECT COUNT(*) FROM Sites;
                       SELECT Sites.Id, Sites.Name, Sites.ContactName, Sites.ContactNumber,
                              Sites.StartedDate, Sites.SiteStatusId, Sites.ExpectedBudget,
                              Sites.Note, Sites.ExpectedCompletionDate, SiteStatus.Status,
                              Addresses.AddressLine1, Addresses.AddressTypeId,
                              AddressTypes.Name AS AddressTypes, Addresses.CountryId,
                              Countries.Name AS CountryName, Addresses.PinCode
                       FROM
                           Sites
                       LEFT JOIN SiteStatus ON Sites.SiteStatusId = SiteStatus.Id
                       LEFT JOIN Addresses ON Sites.Id = Addresses.SiteId
                       LEFT JOIN AddressTypes ON Addresses.AddressTypeId = AddressTypes.Id
                       LEFT JOIN Countries ON Addresses.CountryId = Countries.Id

                       ORDER BY {orderBy}
                       OFFSET @Offset ROWS
                       FETCH NEXT @PageSize ROWS ONLY;";

                using (SqlMapper.GridReader multi = db.QueryMultiple(query, new
                      { Offset = offset, PageSize = pageSize }))
                {
                    int totalCount = multi.Read<int>().Single();

                    List<Site> sites = multi.Read<Site>().AsList();

                    return (sites, totalCount);
                }
            }
        }

        public List<Site> GetSites(string? search, int? statusId, DateTime? fromDate,
                                   DateTime? toDate, decimal? budgetFrom, decimal? budgetTo)
        {
            using (IDbConnection db = new SqlConnection(_connectionString))
            {
                string query = @"SELECT 
                        Sites.Id, Sites.Name, Sites.ContactName, Sites.ContactNumber, Sites.StartedDate,
                        Sites.SiteStatusId, Sites.Note, Sites.ExpectedBudget, Sites.ExpectedCompletionDate,
                        SiteStatus.Status, Addresses.AddressLine1, Addresses.AddressTypeId,
                        AddressTypes.Name AS AddressTypes, Addresses.CountryId,
                        Countries.Name AS CountryName, Addresses.PinCode
                    FROM 
                        Sites

                    LEFT JOIN SiteStatus ON Sites.SiteStatusId = SiteStatus.Id
                    LEFT JOIN Addresses ON Sites.Id = Addresses.SiteId
                    LEFT JOIN AddressTypes ON Addresses.AddressTypeId = AddressTypes.Id
                    LEFT JOIN Countries ON Addresses.CountryId = Countries.Id

                    WHERE(@Search IS NULL OR @Search = ''
                          OR Sites.Name LIKE '%' + @Search + '%'
                          OR Sites.ContactName LIKE '%' + @Search + '%'
                        )
                        AND(@StatusId IS NULL OR Sites.SiteStatusId = @StatusId
                        )
                        AND(@FromDate IS NULL
                            OR(Sites.ExpectedCompletionDate IS NULL OR Sites.ExpectedCompletionDate >= @FromDate)
                        )
                        AND
                        (@ToDate IS NULL
                         OR(Sites.StartedDate IS NULL OR Sites.StartedDate <= @ToDate)
                        )
                        AND(@BudgetFrom IS NULL OR Sites.ExpectedBudget >= @BudgetFrom
                        )
                        AND(@BudgetTo IS NULL OR Sites.ExpectedBudget <= @BudgetTo)";

                var parameters = new
                {
                    Search = string.IsNullOrWhiteSpace(search) ? null : search.Trim(),
                    StatusId = statusId,
                    FromDate = fromDate?.Date,
                    ToDate = toDate?.Date,
                    BudgetFrom = budgetFrom,
                    BudgetTo = budgetTo
                };
                var result = db.Query<Site>(query, parameters).AsList();
                return result;
            }
        }

        public Site GetSiteById(int id)
        {
            using (IDbConnection db = new SqlConnection(_connectionString))
            {
                string query = @"SELECT 
                        Sites.Id, Sites.Name, Sites.ContactName, Sites.ContactNumber,
                        Sites.StartedDate, Sites.ExpectedBudget, Sites.Note,
                        Sites.ExpectedCompletionDate, Sites.SiteStatusId, 
                        SiteStatus.Status, Addresses.AddressLine1, Addresses.AddressTypeId,
                        AddressTypes.Name AS AddressTypes, Addresses.CountryId,
                        Countries.Name AS CountryName, Addresses.PinCode
                    FROM 
                        Sites
                    LEFT JOIN 
                        SiteStatus ON Sites.SiteStatusId = SiteStatus.Id
                    LEFT JOIN 
                        Addresses ON Sites.Id = Addresses.SiteId
                    LEFT JOIN 
                        AddressTypes ON Addresses.AddressTypeId = AddressTypes.Id
                    LEFT JOIN 
                        Countries ON Addresses.CountryId = Countries.Id
                    WHERE Sites.Id = @Id";

                var result = db.QueryFirstOrDefault<Site>(query, new { Id = id });

                return result;
            }
        }

        public int Create(Site site)
        {
            using (IDbConnection db = new SqlConnection(_connectionString))
            {
                string insertQuery = @"
                    INSERT INTO Sites 
                      (Name, ContactName, ContactNumber, StartedDate, SiteStatusId, 
                           Note, ExpectedBudget, ExpectedCompletionDate)
                    VALUES 
                      (@Name, @ContactName, @ContactNumber, @StartedDate, @SiteStatusId, 
                           @Note, @ExpectedBudget, @ExpectedCompletionDate);
                    SELECT CAST(SCOPE_IDENTITY() as int);";

                int insertedId = db.ExecuteScalar<int>(insertQuery, new
                {
                    site.Name,
                    site.ContactName,
                    site.ContactNumber,
                    site.StartedDate,
                    site.SiteStatusId,
                    Note = string.IsNullOrEmpty(site.Note) ? null : site.Note,
                    site.ExpectedBudget,
                    site.ExpectedCompletionDate
                });

                return insertedId;
            }
        }

        public int Update(Site site)
        {
            using (IDbConnection db = new SqlConnection(_connectionString))
            {
                string updateQuery = @"UPDATE Sites SET
                    Name = @Name, ContactName = @ContactName, ContactNumber = @ContactNumber,
                    StartedDate = @StartedDate, SiteStatusId = @SiteStatusId, Note = @Note,
                    ExpectedBudget = @ExpectedBudget, ExpectedCompletionDate = @ExpectedCompletionDate
                    WHERE Id = @Id";

                int affectedRows = db.Execute(updateQuery, new
                {
                    site.Id,
                    site.Name,
                    site.ContactName,
                    site.ContactNumber,
                    site.StartedDate,
                    site.SiteStatusId,
                    Note = string.IsNullOrEmpty(site.Note) ? null : site.Note,
                    site.ExpectedBudget,
                    site.ExpectedCompletionDate
                });
                return affectedRows;
            }
        }


        public void Delete(int siteId)
        {
            using (IDbConnection db = new SqlConnection(_connectionString))
            {
                db.Open();

                using (var transaction = db.BeginTransaction())
                {
                    try
                    {
                        db.Execute("DELETE FROM Addresses WHERE SiteId = @SiteId", new { SiteId = siteId },
                            transaction);

                        db.Execute("DELETE FROM SiteServiceProviders WHERE SiteId = @SiteId", new { SiteId = siteId },
                            transaction);

                        db.Execute("DELETE FROM Sites WHERE Id = @Id", new { Id = siteId },
                            transaction);

                        transaction.Commit();
                    }
                    catch
                    {
                        transaction.Rollback();
                        throw;
                    }
                }
            }
        }


        public List<int> GetServiceProviderIdsByTypes(int siteId, List<ServiceTypes> serviceTypes)
        {
            using (IDbConnection db = new SqlConnection(_connectionString))
            {
                string query = @"SELECT ServiceProviderId FROM SiteServiceProviders
                                 WHERE SiteId = @SiteId 
                                 AND ServiceTypeId IN @ServiceTypeIds";

                var serviceTypeIds = serviceTypes.Select(x => (int)x).ToList();

                var result = db.Query<int>(query, new { SiteId = siteId, ServiceTypeIds = serviceTypeIds }).ToList();
                return result;
            }
        }

        // Approach: 1
        public void AddAOrUpdateSiteServiceProviderBridge(int siteId, ServiceTypes serviceType, List<int> serviceProviderIds)
        {
            using (IDbConnection db = new SqlConnection(_connectionString))
            {
                db.Open();

                using (var transaction = db.BeginTransaction())
                {
                    try
                    {
                        string deleteQuery = @"DELETE FROM SiteServiceProviders
                                               WHERE SiteId = @SiteId
                                                AND ServiceTypeId = @ServiceTypeId";

                        string insertQuery = @"INSERT INTO SiteServiceProviders
                                                (SiteId, ServiceProviderId, ServiceTypeId)
                                               VALUES
                                                (@SiteId, @ServiceProviderId, @ServiceTypeId)";

                        db.Execute(deleteQuery, new { SiteId = siteId, ServiceTypeId = (int)serviceType }, transaction);

                        foreach (int providerId in serviceProviderIds)
                        {
                            db.Execute(insertQuery, new
                            {
                                SiteId = siteId,
                                ServiceProviderId = providerId,
                                ServiceTypeId = (int)serviceType
                            }, transaction);
                        }
                        transaction.Commit();
                    }
                    catch
                    {
                        transaction.Rollback();
                        throw;
                    }
                }
            }
        }

        // ============================================================
        // APPROACH: 2
        // ============================================================

        //public void AddAndUpdateSiteServiceProviderBridge(
        //    int siteId,
        //    ServiceTypes serviceType,
        //    List<int> serviceProviderIds)
        //{
        //    using (IDbConnection db = new SqlConnection(_connectionString))
        //    {
        //        string csvIds = string.Join(",", serviceProviderIds);

        //        string query = @"
        //                DECLARE @NewServiceProviderIds TABLE (ServiceProviderId INT);

        //                INSERT INTO 
        //                       @NewServiceProviderIds (ServiceProviderId)
        //                SELECT 
        //                    TRY_CAST(value AS INT)
        //                FROM 
        //                    STRING_SPLIT(@ServiceProviderIdsCSV, ',')
        //                WHERE TRY_CAST(value AS INT) IS NOT NULL;

        //                DELETE FROM SiteServiceProviders
        //                WHERE 
        //                    SiteId = @SiteId
        //                  AND 
        //                    ServiceTypeId = @ServiceTypeId
        //                  AND 
        //                    ServiceProviderId NOT IN (SELECT ServiceProviderId FROM @NewServiceProviderIds);

        //                MERGE 
        //                    SiteServiceProviders AS target
        //                USING 
        //                    @NewServiceProviderIds AS source
        //                  ON 
        //                    target.SiteId = @SiteId 
        //                  AND 
        //                    target.ServiceTypeId = @ServiceTypeId
        //                  AND 
        //                    target.ServiceProviderId = source.ServiceProviderId
        //                WHEN NOT MATCHED BY TARGET THEN
        //                    INSERT 
        //                        (SiteId, ServiceTypeId, ServiceProviderId)
        //                    VALUES 
        //                        (@SiteId, @ServiceTypeId, source.ServiceProviderId);";

        //        db.Execute(query, new
        //        {
        //            SiteId = siteId,
        //            ServiceTypeId = (int)serviceType,
        //            ServiceProviderIdsCSV = csvIds
        //        });
        //    }
        //}
    }
}

