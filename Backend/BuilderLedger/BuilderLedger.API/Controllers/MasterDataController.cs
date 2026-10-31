
using BuilderLedger.API.APIControllers.ApiEndpoints;
using BuilderLedger.API.DTO;
using BuilderLedger.Core.DataModels;
using BuilderLedger.Core.Enums;
using BuilderLedger.Repository.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BuilderLedger.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MasterDataController : ControllerBase
    {
        private readonly ISiteStatusRepository _siteStatusRepository;
        private readonly IAddressTypeRepository _addressTypeRepository;
        private readonly ICountryRepository _countryRepository;
        private readonly ISiteScopeMasterRepository _siteScopeMasterRepository;
        private readonly ISiteScopeRepository _siteScopeRepository;
        private readonly IServiceProviderRepository _serviceProviderRepository;
        private readonly ILogger<MasterDataController> _logger;

        public MasterDataController(
            ISiteStatusRepository siteStatusRepository,
            IAddressTypeRepository addressTypeRepository,
            ICountryRepository countryRepository,
            ISiteScopeMasterRepository siteScopeMasterRepository,
            ISiteScopeRepository siteScopeRepository,
            IServiceProviderRepository serviceProviderRepository,
            ILogger<MasterDataController> logger)
        {
            _siteStatusRepository = siteStatusRepository;
            _addressTypeRepository = addressTypeRepository;
            _countryRepository = countryRepository;
            _siteScopeMasterRepository = siteScopeMasterRepository;
            _siteScopeRepository = siteScopeRepository;
            _serviceProviderRepository = serviceProviderRepository;
            _logger = logger;
        }

        //GET /api/MasterData/master-data
        [HttpGet(MasterDataAPIEndpoints.MasterData)]
        public IActionResult GetMasterDate(bool siteStatusData, bool addressTypeData, bool countriesData,
                                           bool scopeMastersData, bool scopeStatusesData)
        {
            _logger.LogInformation("API Action: GetDropdownData | Invoked: {InvokedAt}", DateTime.Now.ToString("HH:mm:ss.fff"));

            SiteMasterDataDTO response = new();

            if (siteStatusData == true)
            {
                List<SiteStatus> statuses = _siteStatusRepository.GetAll();
                foreach (SiteStatus status in statuses)
                {
                    response.Statuses.Add(new MasterDataDTO
                    {
                        Id = status.Id,
                        Name = status.Status
                    });
                }
            }

            if (addressTypeData == true)
            {
                List<AddressType> addressTypes = _addressTypeRepository.GetAll();
                foreach (AddressType addressType in addressTypes)
                {
                    response.AddressTypes.Add(new MasterDataDTO
                    {
                        Id = addressType.Id,
                        Name = addressType.Name
                    });
                }
            }

            if (countriesData == true)
            {
                List<Country> countries = _countryRepository.GetAllCountries();
                foreach (Country country in countries)
                {
                    response.Countries.Add(new MasterDataDTO
                    {
                        Id = country.Id,
                        Name = country.Name
                    });
                }
            }

            if (scopeMastersData == true)
            {
                List<SiteScopeMaster> scopeMasters = _siteScopeMasterRepository.GetAll();
                foreach (SiteScopeMaster scope in scopeMasters)
                {
                    response.ScopeMasters.Add(new MasterDataDTO
                    {
                        Id = scope.Id,
                        Name = scope.ScopeName
                    });
                }
            }

            if (scopeStatusesData == true)
            {
                List<SiteScopeStatus> scopeStatuses = _siteScopeRepository.GetAllStatuses();
                foreach (SiteScopeStatus scopeStatus in scopeStatuses)
                {
                    response.ScopeStatuses.Add(new MasterDataDTO
                    {
                        Id = scopeStatus.Id,
                        Name = scopeStatus.StatusName
                    });
                }
            }

            return Ok(response);
        }

        // GET api/MasterData/service-providers
        [HttpGet(MasterDataAPIEndpoints.GetServiceProviders)]
        public IActionResult GetServiceProviders()
        {
            _logger.LogInformation("API Action: GetServiceProviders | Invoked: {InvokedAt}", DateTime.Now.ToString("HH:mm:ss.fff"));

            List<ServiceProviderName> allServiceProviders = _serviceProviderRepository.GetAllServiceProviders();
            List<KeyValuePair<int, string>> masterMasons = new();
            List<KeyValuePair<int, string>> electricians = new();
            List<object> labours = new();
            List<object> plumbers = new();
            List<object> painters = new();
            List<object> carpenters = new();
            List<object> tilers = new();

            foreach (ServiceProviderName serviceProvider in allServiceProviders)
            {
                if (serviceProvider.ServiceTypeId == (int)ServiceTypes.MasterMasion)
                    masterMasons.Add(new KeyValuePair<int, string>(serviceProvider.Id, serviceProvider.Name));

                else if (serviceProvider.ServiceTypeId == (int)ServiceTypes.Electrician)
                    electricians.Add(new KeyValuePair<int, string>(serviceProvider.Id, serviceProvider.Name));

                else if (serviceProvider.ServiceTypeId == (int)ServiceTypes.Labour)
                    labours.Add(new { id = serviceProvider.Id, name = serviceProvider.Name });

                else if (serviceProvider.ServiceTypeId == (int)ServiceTypes.Plumber)
                    plumbers.Add(new { id = serviceProvider.Id, name = serviceProvider.Name });

                else if (serviceProvider.ServiceTypeId == (int)ServiceTypes.Painter)
                    painters.Add(new { id = serviceProvider.Id, name = serviceProvider.Name });

                else if (serviceProvider.ServiceTypeId == (int)ServiceTypes.Carpenter)
                    carpenters.Add(new { id = serviceProvider.Id, name = serviceProvider.Name });

                else if (serviceProvider.ServiceTypeId == (int)ServiceTypes.Tiler)
                    tilers.Add(new { id = serviceProvider.Id, name = serviceProvider.Name });
            }
            return Ok(new { masterMasons, electricians, labours, plumbers, painters, carpenters, tilers });
        }

        // PATCH api/MasterData/scope-status
        [HttpPatch(MasterDataAPIEndpoints.UpdateScopeStatus)]
        public IActionResult UpdateScopeStatus([FromBody] UpdateScopeStatusDTO dto)
        {
            _logger.LogInformation("API Action: UpdateScopeStatus | Invoked: {InvokedAt}", DateTime.Now.ToString("HH:mm:ss.fff"));

            if (dto == null || dto.SiteScopeId <= 0 || dto.ScopeStatusId <= 0)
                return BadRequest("Invalid scope status data.");

            DateTime? completedDate = null;

            if (dto.ScopeStatusId == 3)
                completedDate = DateTime.Today;

            _siteScopeRepository.UpdateScopeStatus(dto.SiteScopeId, dto.ScopeStatusId, dto.Remarks, completedDate);

            return Ok("Scope status updated.");
        }
    }
}
