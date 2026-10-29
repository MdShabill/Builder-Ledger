using BuilderLedger.Repository.Dapper;
using BuilderLedger.Repository.Interfaces;


namespace BuilderLedger.API.Helpers
{
    public class RepositoryRegistration
    {
        //Approach: 1 = With constructor 
        //private readonly IServiceCollection _services;
        //private readonly string _connectionString;

        //public RepositoryRegistration(IServiceCollection services, string connectionString)
        //{
        //    _services = services;
        //    _connectionString = connectionString;
        //}

        //Approach: 2 Without constructor we use as parameters
        //public void RegisterAdoDotNetRepositories(IServiceCollection services, string connectionString)
        //{
        //    services.AddScoped<ICostMasterRepository>(svc => new CostMasterRepository(connectionString));
        //    services.AddScoped<IDailyAttendanceRepository>(svc => new DailyAttendanceRepository(connectionString));
        //    services.AddScoped<IMaterialPurchaseRepository>(svc => new MaterialPurchaseRepository(connectionString));
        //    services.AddScoped<IMaterialRepository>(svc => new MaterialRepository(connectionString));
        //    services.AddScoped<ISupplierRepository>(svc => new SupplierRepository(connectionString));
        //    services.AddScoped<IBrandRepository>(svc => new BrandRepository(connectionString));
        //    services.AddScoped<IServiceTypeRepository>(svc => new ServiceTypeRepository(connectionString));
        //    services.AddScoped<IServiceProviderRepository>(svc => new ServiceProviderRepository(connectionString));
        //    services.AddScoped<IAddressRepository>(svc => new AddressRepository(connectionString));
        //    services.AddScoped<ICountryRepository>(svc => new CountryRepository(connectionString));
        //    services.AddScoped<IAddressTypeRepository>(svc => new AddressTypeRepository(connectionString));
        //    services.AddScoped<IUserRepository>(svc => new UserRepository(connectionString));
        //    //services.AddScoped<ISiteRepository>(svc => new SiteRepository(connectionString));
        //    services.AddScoped<ISiteStatusRepository>(svc => new SiteStatusRepository(connectionString));
        //}

        //public void RegisterAdoDotNetUsingSpRepositories(IServiceCollection services, string connectionString)
        //{
        //    services.AddScoped<ICostMasterRepository>(svc => new CostMasterRepositoryUsingSp(connectionString));
        //    services.AddScoped<IDailyAttendanceRepository>(svc => new DailyAttendanceRepositoryUsingSp(connectionString));
        //    services.AddScoped<IMaterialPurchaseRepository>(svc => new MaterialPurchaseRepositoryUsingSp(connectionString));
        //    services.AddScoped<IMaterialRepository>(svc => new MaterialRepositoryUsingSp(connectionString));
        //    services.AddScoped<ISupplierRepository>(svc => new SupplierRepositoryUsingSp(connectionString));
        //    services.AddScoped<IBrandRepository>(svc => new BrandRepositoryUsingSp(connectionString));
        //    services.AddScoped<IServiceTypeRepository>(svc => new ServiceTypeRepositoryUsingSp(connectionString));
        //    services.AddScoped<IServiceProviderRepository>(svc => new ServiceProviderRepositoryUsingSp(connectionString));
        //    //services.AddScoped<IAddressRepository>(svc => new AddressRepositoryUsingSp(connectionString));
        //    services.AddScoped<ICountryRepository>(svc => new CountryRepositoryUsingSp(connectionString));
        //    services.AddScoped<IAddressTypeRepository>(svc => new AddressTypeRepositoryUsingSp(connectionString));
        //}

        public void RegisterDapperRepositories(IServiceCollection services, string connectionString)
        {
            services.AddScoped<IDashboardRepository>(svc => new DashboardRepositoryUsingDapper(connectionString));

            services.AddScoped<ICostMasterRepository>(svc => new CostMasterRepositoryUsingDapper(connectionString));

            services.AddScoped<IDailyAttendanceRepository>(svc => new DailyAttendanceRepositoryUsingDapper(connectionString));

            services.AddScoped<IMaterialPurchaseRepository>(svc => new MaterialPurchaseRepositoryUsingDapper(connectionString));

            services.AddScoped<IMaterialRepository>(svc => new MaterialRepositoryUsingDapper(connectionString));

            services.AddScoped<ISupplierRepository>(svc => new SupplierRepositoryUsingDapper(connectionString));

            services.AddScoped<IBrandRepository>(svc => new BrandRepositoryUsingDapper(connectionString));

            services.AddScoped<IServiceTypeRepository>(svc => new ServiceTypeRepositoryUsingDapper(connectionString));

            services.AddScoped<IServiceProviderRepository>(provider => new ServiceProviderRepositoryUsingDapper(connectionString));

            services.AddScoped<IUserRepository>(svc => new UserRepositoryUsingDapper(connectionString));

            services.AddScoped<ISiteRepository>(svc => new SiteRepositoryUsingDapper(connectionString));

            services.AddScoped<ISiteScopeMasterRepository>(provider => new SiteScopeMasterRepositoryUsingDapper(connectionString));

            services.AddScoped<ISiteScopeRepository>(provider => new SiteScopeRepositoryUsingDapper(connectionString));

            services.AddScoped<IAddressRepository>(svc => new AddressRepositoryUsingDapper(connectionString));

            services.AddScoped<ICountryRepository>(svc => new CountryRepositoryUsingDapper(connectionString));

            services.AddScoped<IAddressTypeRepository>(svc => new AddressTypeRepositoryUsingDapper(connectionString));

            services.AddScoped<ISiteStatusRepository>(svc => new SiteStatusRepositoryUsingDapper(connectionString));
        }

        //public void RegisterDapperUsingSpRepositories(IServiceCollection services, string connectionString)
        //{
        //    services.AddScoped<ICostMasterRepository>(svc => new CostMasterRepositoryDapperUsingSp(connectionString));
        //    services.AddScoped<IDailyAttendanceRepository>(svc => new DailyAttendanceRepositoryDapperUsingSp(connectionString));
        //    services.AddScoped<IMaterialPurchaseRepository>(svc => new MaterialPurchaseRepositoryDapperUsingSp(connectionString));
        //    services.AddScoped<IMaterialRepository>(svc => new MaterialRepositoryDapperUsingSp(connectionString));
        //    services.AddScoped<ISupplierRepository>(svc => new SupplierRepositoryDapperUsingSp(connectionString));
        //    services.AddScoped<IBrandRepository>(svc => new BrandRepositoryDapperUsingSp(connectionString));
        //    services.AddScoped<IServiceTypeRepository>(svc => new ServiceTypeRepositoryDapperUsingSp(connectionString));
        //    services.AddScoped<IServiceProviderRepository>(svc => new ServiceProviderRepositoryDapperUsingSp(connectionString));
        //    //services.AddScoped<IAddressRepository>(svc => new AddressRepositoryDapperUsingSp(connectionString));
        //    services.AddScoped<ICountryRepository>(svc => new CountryRepositoryDapperUsingSp(connectionString));
        //    services.AddScoped<IAddressTypeRepository>(svc => new AddressTypeRepositoryDapperUsingSp(connectionString));
        //}
    }
}
