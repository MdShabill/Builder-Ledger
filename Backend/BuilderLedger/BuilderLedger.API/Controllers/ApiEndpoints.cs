namespace BuilderLedger.API.APIControllers
{
    namespace ApiEndpoints
    {
        public class AccountAPIEndpoints
        {
            public const string Login = "login";
        }

        public class CostMasterAPIEnpoints
        {
            public const string Index = "Index";
            public const string GetActiveCost = "GetActiveCost";
            public const string GetById = "{id:int}";
            public const string Add = "";
            public const string Update = "{id:int}";
            public const string Delete = "{id:int}";
        }

        public class DilyAttendanceAPIEnpoints
        {
            public const string Index = "";
            public const string GetCostByServiceType = "GetCostByServiceType";
            public const string GetDropdownData = "dropdown-data";
            public const string Add = "";
        }

        public class DashbordAPIEnpoints
        {
            public const string GetStats = "Stats";
            public const string GetScopeItems = "scope-items";
            public const string GetMonthlyActivity = "monthly-activity";
        }

        public class MaterialPurchaseAPIEnpoints
        {
            public const string Index = "";
            public const string DropdownData = "dropdown-data";
            public const string GetMaterialInfo = "material-info";
            public const string Add = "";
            public const string Delete = "{id}";
        }

        public class ServiceProviderAPIEnpoints
        {
            public const string Index = "";
            public const string GetById = "{id}";
            public const string Add = "";
            public const string Update = "{id}";
            public const string Delete = "{id}";
            public const string DropdownData = "dropdown-data";
        }

        public class SiteAPIEnpoints
        {
            // GET    api/Site                    -> list all sites
            public const string GetAll = "";
            // GET    api/Site/filter?search=...  -> filtered list
            public const string FilterSites = "filter";

            // POST   api/Site                    -> create
            public const string Add = "";
            // GET    api/Site/2                  -> load one site (Edit page)
            public const string Edit = "{id:int}";
            // PUT    api/Site/2                  -> update
            public const string Update = "{id:int}";
            // DELETE api/Site/2                  -> delete
            public const string Delete = "{id:int}";

            public const string DropdownData = "dropdown-data";
            public const string GetServiceProviders = "service-providers";
            public const string UpdateScopeStatus = "scope-status";
        }

        public class SiteReportAPIEnpoints
        {
            public const string GeneratePdf = "generate-pdf";
        }
    }
}
