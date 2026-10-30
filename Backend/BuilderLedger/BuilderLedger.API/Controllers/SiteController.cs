using AutoMapper;
using BuilderLedger.API.APIControllers.ApiEndpoints;
using BuilderLedger.API.Controllers.APIViewModels;
using BuilderLedger.API.Services;
using BuilderLedger.Core.DataModels;
using BuilderLedger.Core.Enums;
using BuilderLedger.Repository.Interfaces;
using MailKit;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace BuilderLedger.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SiteController : ControllerBase
    {
        private readonly ISiteStatusRepository _siteStatusRepository;
        private readonly IAddressRepository _addressRepository;
        private readonly IAddressTypeRepository _addressTypeRepository;
        private readonly ICountryRepository _countryRepository;
        private readonly IServiceProviderRepository _serviceProviderRepository;
        private readonly ISiteRepository _siteRepository;
        private readonly IMapper _imapper;
        private readonly IMemoryCache _cache;
        private readonly ISiteScopeMasterRepository _siteScopeMasterRepository;
        private readonly ISiteScopeRepository _siteScopeRepository;
        private readonly ILogger<SiteController> _logger;
        private readonly IEmailService _emailService;
        private readonly SiteUpdateEmailService _updateEmailService;
        private readonly SiteDeleteEmailService _siteDeleteEmailService;

        public SiteController(
            ISiteStatusRepository siteStatusRepository,
            IAddressRepository addressRepository,
            IAddressTypeRepository addressTypeRepository,
            ICountryRepository countryRepository,
            IServiceProviderRepository serviceProviderRepository,
            ISiteRepository siteRepository,
            IMemoryCache cache,
            ISiteScopeMasterRepository siteScopeMasterRepository,
            ISiteScopeRepository siteScopeRepository,
            ILogger<SiteController> logger,
            IEmailService emailService,
            SiteUpdateEmailService updateEmailService,
            SiteDeleteEmailService siteDeleteEmailService)
        {
            _siteRepository = siteRepository;
            _siteStatusRepository = siteStatusRepository;
            _addressRepository = addressRepository;
            _addressTypeRepository = addressTypeRepository;
            _countryRepository = countryRepository;
            _serviceProviderRepository = serviceProviderRepository;
            _cache = cache;
            _siteScopeMasterRepository = siteScopeMasterRepository;
            _siteScopeRepository = siteScopeRepository;
            _logger = logger;
            _emailService = emailService;
            _updateEmailService = updateEmailService;
            _siteDeleteEmailService = siteDeleteEmailService;

            MapperConfiguration configuration = new(cfg =>
            {
                cfg.CreateMap<Site, SiteAPIDTO>();
                cfg.CreateMap<SiteAPIDTO, Site>();
                cfg.CreateMap<Site, SiteAPIVm>();
            });
            _imapper = configuration.CreateMapper();
        }

        // GET api/Site
        [HttpGet(SiteAPIEnpoints.GetAll)]
        public IActionResult GetAll()
        {
            _logger.LogInformation("API Action: GetAll | Invoked: {InvokedAt}", DateTime.Now.ToString("HH:mm:ss.fff"));

            const string cacheKey = "AllSites";

            List<Site> sites;
            if (!_cache.TryGetValue(cacheKey, out sites))
            {
                sites = _siteRepository.GetAll();
                var cacheEntryOptions = new MemoryCacheEntryOptions()
                    .SetSlidingExpiration(TimeSpan.FromMinutes(10));
                _cache.Set(cacheKey, sites, cacheEntryOptions);
            }
            var siteApiVm = _imapper.Map<List<Site>, List<SiteAPIDTO>>(sites);

            _logger.LogInformation("\nTotal Site: {TotalSite}", sites?.Count ?? 0);

            return Ok(siteApiVm);
        }

        // GET api/Site/filter?search=&statusId=&fromDate=&toDate=&budgetFrom=&budgetTo=
        [HttpGet(SiteAPIEnpoints.FilterSites)]
        public IActionResult FilterSites(string? search, int? statusId, DateTime? fromDate, DateTime? toDate,
                                         decimal? budgetFrom, decimal? budgetTo)
        {
            _logger.LogInformation("API Action: FilterSites | Invoked: {InvokedAt}", DateTime.Now.ToString("HH:mm:ss.fff"));

            if (fromDate.HasValue && toDate.HasValue && fromDate > toDate)
                return BadRequest("From Date cannot be greater than To Date.");

            if (budgetFrom.HasValue && budgetFrom < 0)
                return BadRequest("Budget From cannot be negative.");

            if (budgetTo.HasValue && budgetTo < 0)
                return BadRequest("Budget To cannot be negative.");

            if (budgetFrom.HasValue && budgetTo.HasValue && budgetFrom > budgetTo)
                return BadRequest("Budget From cannot be greater than Budget To.");

            List<Site> sites = _siteRepository.GetSites(search, statusId, fromDate, toDate, budgetFrom, budgetTo);
            var siteApiDto = _imapper.Map<List<Site>, List<SiteAPIDTO>>(sites);

            _logger.LogInformation("\nTotal Site: {TotalSite}", sites?.Count ?? 0);

            return Ok(siteApiDto);
        }

        // POST api/Site
        [HttpPost(SiteAPIEnpoints.Add)]
        public IActionResult Add(SiteAPIDTO siteApiDto)
        {
            _logger.LogInformation("API Action: Add | Started: {StartedAt}", DateTime.Now.ToString("HH:mm:ss.fff"));

            if (siteApiDto == null)
                return BadRequest("Invalid data");

            Site site = _imapper.Map<SiteAPIDTO, Site>(siteApiDto);
            site.Id = _siteRepository.Create(site);

            if (site.Id <= 0)
                return StatusCode(500, "Failed to create site");

            AddAddressIfPresent(site.Id, siteApiDto);

            if (siteApiDto.SelectedMasterMasonIds?.Count > 0)
                _siteRepository.AddAOrUpdateSiteServiceProviderBridge(site.Id, ServiceTypes.MasterMasion, siteApiDto.SelectedMasterMasonIds);

            if (siteApiDto.SelectedElectricianIds?.Count > 0)
                _siteRepository.AddAOrUpdateSiteServiceProviderBridge(site.Id, ServiceTypes.Electrician, siteApiDto.SelectedElectricianIds);

            if (siteApiDto.SelectedLabourIds?.Count > 0)
                _siteRepository.AddAOrUpdateSiteServiceProviderBridge(site.Id, ServiceTypes.Labour, siteApiDto.SelectedLabourIds);

            if (siteApiDto.SelectedPlumberIds?.Count > 0)
                _siteRepository.AddAOrUpdateSiteServiceProviderBridge(site.Id, ServiceTypes.Plumber, siteApiDto.SelectedPlumberIds);

            if (siteApiDto.SelectedPainterIds?.Count > 0)
                _siteRepository.AddAOrUpdateSiteServiceProviderBridge(site.Id, ServiceTypes.Painter, siteApiDto.SelectedPainterIds);

            if (siteApiDto.SelectedCarpenterIds?.Count > 0)
                _siteRepository.AddAOrUpdateSiteServiceProviderBridge(site.Id, ServiceTypes.Carpenter, siteApiDto.SelectedCarpenterIds);

            if (siteApiDto.SelectedTilerIds?.Count > 0)
                _siteRepository.AddAOrUpdateSiteServiceProviderBridge(site.Id, ServiceTypes.Tiler, siteApiDto.SelectedTilerIds);

            if (siteApiDto.SelectedScopes?.Count > 0)
            {
                List<(int, int, string?)> mappedScopes = new();

                foreach (ScopeSaveItem scope in siteApiDto.SelectedScopes)
                {
                    mappedScopes.Add((scope.SiteScopeMasterId, scope.ScopeStatusId, scope.Remarks));
                }
                _siteScopeRepository.SaveScopes(site.Id, mappedScopes);
            }

            string addedByName = User?.Identity?.Name ?? "System";

            // Start email processing without waiting for SMTP to finish.
            _ = SiteAddedNotification(site, siteApiDto, addedByName);

            // Return the site-save response without waiting for email delivery.
            return Ok(new
            {
                message = "Site successfully saved",
                siteId = site.Id
            });
        }


        // GET api/Site/2
        [HttpGet(SiteAPIEnpoints.Edit)]
        public IActionResult Edit(int id)
        {
            _logger.LogInformation("API Action: Edit | Invoked: {InvokedAt}", DateTime.Now.ToString("HH:mm:ss.fff"));

            Site selectedSite = _siteRepository.GetSiteById(id);

            if (selectedSite == null)
                return NotFound("Site not found");

            SiteAPIVm siteApiVm = _imapper.Map<Site, SiteAPIVm>(selectedSite);
            siteApiVm.MasterMasonIds = _siteRepository.GetServiceProviderIdsByTypes(id, new List<ServiceTypes> { ServiceTypes.MasterMasion });
            siteApiVm.ElectricianIds = _siteRepository.GetServiceProviderIdsByTypes(id, new List<ServiceTypes> { ServiceTypes.Electrician });
            siteApiVm.LabourIds = _siteRepository.GetServiceProviderIdsByTypes(id, new List<ServiceTypes> { ServiceTypes.Labour });
            siteApiVm.PlumberIds = _siteRepository.GetServiceProviderIdsByTypes(id, new List<ServiceTypes> { ServiceTypes.Plumber });
            siteApiVm.PainterIds = _siteRepository.GetServiceProviderIdsByTypes(id, new List<ServiceTypes> { ServiceTypes.Painter });
            siteApiVm.CarpenterIds = _siteRepository.GetServiceProviderIdsByTypes(id, new List<ServiceTypes> { ServiceTypes.Carpenter });
            siteApiVm.TilerIds = _siteRepository.GetServiceProviderIdsByTypes(id, new List<ServiceTypes> { ServiceTypes.Tiler });

            List<SiteScope> scopes = _siteScopeRepository.Get(id);
            siteApiVm.Scopes = new List<SiteScopeVm>();

            foreach (SiteScope scope in scopes)
            {
                SiteScopeVm scopeVm = new()
                {
                    Id = scope.Id,
                    SiteScopeMasterId = scope.SiteScopeId,
                    ScopeName = scope.ScopeName,
                    ScopeStatusId = scope.ScopeStatusId,
                    StatusName = scope.StatusName,
                    Remarks = scope.Remarks,
                    CompletedDate = scope.CompletedDate
                };
                siteApiVm.Scopes.Add(scopeVm);
            }
            return Ok(siteApiVm);
        }

        // PUT api/Site/2
        [HttpPut(SiteAPIEnpoints.Update)]
        public async Task<IActionResult> Update(int id, [FromBody] SiteAPIDTO siteApiDto)
        {
            _logger.LogInformation("API Action: Update | Invoked: {InvokedAt}", DateTime.Now.ToString("HH:mm:ss.fff"));
 
            if (siteApiDto == null || id <= 0)
                return BadRequest("Invalid site data.");
 
            // The id in the URL is the source of truth.
            siteApiDto.Id = id;
 
            Site oldSite = _siteRepository.GetSiteById(id);
 
            if (oldSite == null)
                return NotFound("Site not found");
 
            List<SiteScope> oldScopes = _siteScopeRepository.Get(id);
 
            Site site = _imapper.Map<SiteAPIDTO, Site>(siteApiDto);
            int affectedRows = _siteRepository.Update(site);
 
            if (affectedRows <= 0)
                return StatusCode(500, "Site update failed.");
 
            // Save address.
            AddAddressIfPresent(site.Id, siteApiDto);
 
            // Save service provider assignments.
            _siteRepository.AddAOrUpdateSiteServiceProviderBridge(site.Id, ServiceTypes.MasterMasion, siteApiDto.SelectedMasterMasonIds ?? new List<int>());
            _siteRepository.AddAOrUpdateSiteServiceProviderBridge(site.Id, ServiceTypes.Electrician, siteApiDto.SelectedElectricianIds ?? new List<int>());
            _siteRepository.AddAOrUpdateSiteServiceProviderBridge(site.Id, ServiceTypes.Labour, siteApiDto.SelectedLabourIds ?? new List<int>());
            _siteRepository.AddAOrUpdateSiteServiceProviderBridge(site.Id, ServiceTypes.Plumber, siteApiDto.SelectedPlumberIds ?? new List<int>());
            _siteRepository.AddAOrUpdateSiteServiceProviderBridge(site.Id, ServiceTypes.Painter, siteApiDto.SelectedPainterIds ?? new List<int>());
            _siteRepository.AddAOrUpdateSiteServiceProviderBridge(site.Id, ServiceTypes.Carpenter, siteApiDto.SelectedCarpenterIds ?? new List<int>());
            _siteRepository.AddAOrUpdateSiteServiceProviderBridge(site.Id, ServiceTypes.Tiler, siteApiDto.SelectedTilerIds ?? new List<int>());
 
            // Save selected work scopes.
            List<(int, int, string?)> mappedScopes = new();
            List<ScopeSaveItem> selectedScopes = siteApiDto.SelectedScopes ?? new();
 
            foreach (ScopeSaveItem scope in selectedScopes)
            {
                mappedScopes.Add((scope.SiteScopeMasterId, scope.ScopeStatusId, scope.Remarks));
            }
 
            _siteScopeRepository.SaveScopes(site.Id, mappedScopes);
 
            // Refresh cached sites.
            _cache.Remove("AllSites");
 
            // Compare old and new data and send notification email.
            bool emailSent = await SendSiteUpdateEmail(siteApiDto, oldSite, oldScopes);
 
            _logger.LogInformation("Site {SiteId} updated. Email sent: {EmailSent}", site.Id, emailSent);
 
            return Ok(new
            {
                message = "Site updated successfully.",
                siteId = site.Id
            });
        }

        // DELETE api/Site/3
        [HttpDelete(SiteAPIEnpoints.Delete)]
        public async Task<IActionResult> Delete(int siteId)
        {
            _logger.LogInformation("API Action: Delete | Invoked: {InvokedAt}", DateTime.Now.ToString("HH:mm:ss.fff"));

            if (siteId <= 0)
                return BadRequest();

            Site? site = _siteRepository.GetSiteById(siteId);

            if (site == null)
                return NotFound();

            string siteName = site.Name ?? "Not Provided";
            string deletedBy = User.Identity?.Name ?? "System";
            DateTime deletedAt = DateTime.Now;

            _siteScopeRepository.SaveScopes(siteId, new List<(int, int, string?)>());

            _addressRepository.Delete(0, siteId);
            _siteRepository.Delete(siteId);

            await _siteDeleteEmailService.SendAsync(siteId, siteName, deletedBy, deletedAt);

            return NoContent();
        }


        //GET /api/Site/master-data
        [HttpGet(SiteAPIEnpoints.MasterData)]
        public IActionResult GetMasterDate(bool siteStatusData, bool addressTypeData, bool countriesData,
                                           bool scopeMastersData, bool scopeStatusesData)
        {
            _logger.LogInformation("API Action: GetDropdownData | Invoked: {InvokedAt}", DateTime.Now.ToString("HH:mm:ss.fff"));

            List<SiteStatus> statuses;
            if (siteStatusData)
            {
                statuses = _siteStatusRepository.GetAll();
                List<SiteDropdownDTO> statusItems = new();
                foreach (SiteStatus status in statuses)
                {
                    statusItems.Add(new SiteDropdownDTO
                    {
                        Id = status.Id,
                        Name = status.Status
                    });
                }

            }

            List<AddressType> addressTypes;
            if (addressTypeData)
            {
                addressTypes = _addressTypeRepository.GetAll();
                List<SiteDropdownDTO> addressTypeItems = new();
                foreach (AddressType addressType in addressTypes)
                {
                    addressTypeItems.Add(new SiteDropdownDTO
                    {
                        Id = addressType.Id,
                        Name = addressType.Name
                    });
                }
            }

            List<Country> countries;
            if(countriesData)
            {
                countries = _countryRepository.GetAllCountries();
                List<SiteDropdownDTO> countryItems = new();
                foreach (Country country in countries)
                {
                    countryItems.Add(new SiteDropdownDTO
                    {
                        Id = country.Id,
                        Name = country.Name
                    });
                }
            }

            List<SiteScopeMaster> scopeMasters;
            if(scopeMastersData)
            {
                scopeMasters = _siteScopeMasterRepository.GetAll();
                List<SiteDropdownDTO> scopeMasterItems = new();
                foreach (SiteScopeMaster scope in scopeMasters)
                {
                    scopeMasterItems.Add(new SiteDropdownDTO
                    {
                        Id = scope.Id,
                        Name = scope.ScopeName
                    });
                }
            }

            List<SiteScopeStatus> scopeStatuses;
            if(scopeStatusesData)
            {
                scopeStatuses = _siteScopeRepository.GetAllStatuses();
                List<SiteDropdownDTO> scopeStatusItems = new();
                foreach (SiteScopeStatus scopeStatus in scopeStatuses)
                {
                    scopeStatusItems.Add(new SiteDropdownDTO
                    {
                        Id = scopeStatus.Id,
                        Name = scopeStatus.StatusName
                    });
                }
            }

            SiteMasterDataDTO response = new()
            {
                Statuses = new List<SiteDropdownDTO>(),
                AddressTypes = new List<SiteDropdownDTO>(),
                Countries = new List<SiteDropdownDTO>(),
                ScopeMasters = new List<SiteDropdownDTO>(),
                ScopeStatuses = new List<SiteDropdownDTO>()
            };
            return Ok(response);
        }

        // GET api/Site/service-providers
        [HttpGet(SiteAPIEnpoints.GetServiceProviders)]
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

        // PATCH api/Site/scope-status
        [HttpPatch(SiteAPIEnpoints.UpdateScopeStatus)]
        public IActionResult UpdateScopeStatus([FromBody] UpdateScopeStatusDto dto)
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

        private async Task SiteAddedNotification(Site site, SiteAPIDTO siteApiDto, string addedByName)
        {
            string siteStatusName = "Not Provided";
            List<SiteStatus> siteStatuses = _siteStatusRepository.GetAll();

            foreach (SiteStatus status in siteStatuses)
            {
                if (status.Id == site.SiteStatusId)
                {
                    siteStatusName = status.Status ?? "Not Provided";
                    break;
                }
            }
            string siteAddress = "";

            if (!string.IsNullOrWhiteSpace(siteApiDto.AddressLine1))
                siteAddress = siteApiDto.AddressLine1;

            if (!string.IsNullOrWhiteSpace(siteApiDto.CountryName))
            {
                if (siteAddress != "")
                    siteAddress += ", ";
                siteAddress += siteApiDto.CountryName;
            }

            if (siteApiDto.PinCode.HasValue)
            {
                if (siteAddress != "")
                    siteAddress += ", ";
                siteAddress += siteApiDto.PinCode.Value.ToString();
            }

            List<SiteScope> siteScopes = _siteScopeRepository.Get(site.Id);
            string workScope = "";

            foreach (SiteScope scope in siteScopes)
            {
                if (string.IsNullOrWhiteSpace(scope.ScopeName))
                    continue;

                if (workScope.Contains(scope.ScopeName))
                    continue;

                if (workScope != "")
                    workScope += " · ";
                workScope += scope.ScopeName;
            }

            await _emailService.SendNewSiteNotificationAsync(
                site.Id, site.Name ?? "Not Provided", site.ContactName ?? "Not Provided",
                site.ContactNumber ?? "Not Provided", siteStatusName, site.ExpectedBudget,
                site.StartedDate, site.ExpectedCompletionDate, siteAddress, workScope,
                site.Note ?? "", addedByName);
        }

        private async Task<bool> SendSiteUpdateEmail(SiteAPIDTO siteApiDto, Site oldSite, List<SiteScope> oldScopes)
        {
            if (oldSite == null)
                return false;

            List<SiteUpdateChange> changes = new();
            List<ScopeSaveItem> newScopes = siteApiDto.SelectedScopes ?? new();

            // Check site status.
            if (oldSite.SiteStatusId != siteApiDto.SiteStatusId)
            {
                string oldStatus = "Not Provided";
                string newStatus = "Not Provided";

                List<SiteStatus> allSiteStatuses = _siteStatusRepository.GetAll();

                foreach (SiteStatus status in allSiteStatuses)
                {
                    if (status.Id == oldSite.SiteStatusId)
                        oldStatus = status.Status ?? "Not Provided";

                    if (status.Id == siteApiDto.SiteStatusId)
                        newStatus = status.Status ?? "Not Provided";
                }

                changes.Add(new SiteUpdateChange
                {
                    FieldName = "Site Status",
                    OldValue = oldStatus,
                    NewValue = newStatus
                });
            }

            // Check expected budget.
            if (oldSite.ExpectedBudget != siteApiDto.ExpectedBudget)
            {
                changes.Add(new SiteUpdateChange
                {
                    FieldName = "Expected Budget",
                    OldValue = oldSite.ExpectedBudget.HasValue
                        ? $"₹{oldSite.ExpectedBudget.Value:N0}" : "Not Provided",
                    NewValue = siteApiDto.ExpectedBudget.HasValue
                        ? $"₹{siteApiDto.ExpectedBudget.Value:N0}" : "Not Provided"
                });
            }

            // Check removed scopes and changed scope statuses.
            List<SiteScopeStatus> allScopeStatuses = _siteScopeRepository.GetAllStatuses();
            foreach (SiteScope oldScope in oldScopes)
            {
                ScopeSaveItem? matchingScope = null;

                foreach (ScopeSaveItem newScope in newScopes)
                {
                    if (newScope.SiteScopeMasterId == oldScope.SiteScopeId)
                    {
                        matchingScope = newScope;
                        break;
                    }
                }
                string scopeName = oldScope.ScopeName ?? $"Scope #{oldScope.SiteScopeId}";

                if (matchingScope == null)
                {
                    changes.Add(new SiteUpdateChange
                    {
                        FieldName = "Work Scope Removed",
                        OldValue = scopeName,
                        NewValue = "Removed"
                    });

                    continue;
                }

                if (oldScope.ScopeStatusId != matchingScope.ScopeStatusId)
                {
                    string oldStatus = oldScope.StatusName ?? "Not Provided";
                    string newStatus = "Not Provided";

                    foreach (SiteScopeStatus status in allScopeStatuses)
                    {
                        if (status.Id == matchingScope.ScopeStatusId)
                        {
                            newStatus = status.StatusName ?? "Not Provided";
                            break;
                        }
                    }

                    changes.Add(new SiteUpdateChange
                    {
                        FieldName = $"Work Scope Status - {scopeName}",
                        OldValue = oldStatus,
                        NewValue = newStatus
                    });
                }
            }

            // Check newly added scopes.
            List<SiteScopeMaster> allScopeMasters = _siteScopeMasterRepository.GetAll();

            foreach (ScopeSaveItem newScope in newScopes)
            {
                bool alreadyExists = false;

                foreach (SiteScope oldexistingScope in oldScopes)
                {
                    if (oldexistingScope.SiteScopeId == newScope.SiteScopeMasterId)
                    {
                        alreadyExists = true;
                        break;
                    }
                }

                if (alreadyExists)
                    continue;

                string scopeName = $"Scope #{newScope.SiteScopeMasterId}";

                foreach (SiteScopeMaster master in allScopeMasters)
                {
                    if (master.Id == newScope.SiteScopeMasterId)
                    {
                        scopeName = master.ScopeName ?? scopeName;
                        break;
                    }
                }

                changes.Add(new SiteUpdateChange
                {
                    FieldName = "Work Scope Added",
                    OldValue = "Not Assigned",
                    NewValue = scopeName
                });
            }

            if (changes.Count == 0)
                return false;

            await _updateEmailService.SendAsync(siteApiDto.Name ?? oldSite.Name ?? "Unnamed Site",
                                                User?.Identity?.Name ?? "System", DateTime.Now, changes);

            return true;
        }

        private void AddAddressIfPresent(int siteId, SiteAPIDTO siteApiDto)
        {
            if (!string.IsNullOrEmpty(siteApiDto.AddressLine1)
                || siteApiDto.AddressTypeId > 0
                || siteApiDto.CountryId > 0
                || siteApiDto.PinCode > 0)
            {
                Address address = new(0,
                    siteApiDto.AddressLine1,
                    siteApiDto.AddressTypeId ?? 0,
                    siteApiDto.CountryId ?? 0,
                    siteApiDto.PinCode ?? 0,
                    siteId);

                _addressRepository.Upsert(address);
            }
        }
    }

    public class UpdateScopeStatusDto
    {
        public int SiteScopeId { get; set; }
        public int ScopeStatusId { get; set; }
        public string? Remarks { get; set; }
    }
}
