using AutoMapper;
using BuilderLedger.API.APIControllers.ApiEndpoints;
using BuilderLedger.API.DTO;
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
            _cache = cache;
            _siteScopeMasterRepository = siteScopeMasterRepository;
            _siteScopeRepository = siteScopeRepository;
            _logger = logger;
            _emailService = emailService;
            _updateEmailService = updateEmailService;
            _siteDeleteEmailService = siteDeleteEmailService;

            MapperConfiguration configuration = new(cfg =>
            {
                cfg.CreateMap<Site, SiteDTO>();
                cfg.CreateMap<SiteDTO, Site>();
                cfg.CreateMap<Site, SiteDTO>();
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
            var siteDto = _imapper.Map<List<Site>, List<SiteDTO>>(sites);

            _logger.LogInformation("\nTotal Site: {TotalSite}", sites?.Count ?? 0);

            return Ok(siteDto);
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
            var siteDto = _imapper.Map<List<Site>, List<SiteDTO>>(sites);

            _logger.LogInformation("\nTotal Site: {TotalSite}", sites?.Count ?? 0);

            return Ok(siteDto);
        }

        // POST api/Site
        [HttpPost(SiteAPIEnpoints.Add)]
        public IActionResult Add(SiteDTO siteDto)
        {
            _logger.LogInformation("API Action: Add | Started: {StartedAt}", DateTime.Now.ToString("HH:mm:ss.fff"));

            if (siteDto == null)
                return BadRequest("Invalid data");

            Site site = _imapper.Map<SiteDTO, Site>(siteDto);
            site.Id = _siteRepository.Create(site);

            if (site.Id <= 0)
                return StatusCode(500, "Failed to create site");

            AddAddressIfPresent(site.Id, siteDto);

            if (siteDto.SelectedMasterMasonIds?.Count > 0)
                _siteRepository.AddAOrUpdateSiteServiceProviderBridge(site.Id, ServiceTypes.MasterMasion, siteDto.SelectedMasterMasonIds);

            if (siteDto.SelectedElectricianIds?.Count > 0)
                _siteRepository.AddAOrUpdateSiteServiceProviderBridge(site.Id, ServiceTypes.Electrician, siteDto.SelectedElectricianIds);

            if (siteDto.SelectedLabourIds?.Count > 0)
                _siteRepository.AddAOrUpdateSiteServiceProviderBridge(site.Id, ServiceTypes.Labour, siteDto.SelectedLabourIds);

            if (siteDto.SelectedPlumberIds?.Count > 0)
                _siteRepository.AddAOrUpdateSiteServiceProviderBridge(site.Id, ServiceTypes.Plumber, siteDto.SelectedPlumberIds);

            if (siteDto.SelectedPainterIds?.Count > 0)
                _siteRepository.AddAOrUpdateSiteServiceProviderBridge(site.Id, ServiceTypes.Painter, siteDto.SelectedPainterIds);

            if (siteDto.SelectedCarpenterIds?.Count > 0)
                _siteRepository.AddAOrUpdateSiteServiceProviderBridge(site.Id, ServiceTypes.Carpenter, siteDto.SelectedCarpenterIds);

            if (siteDto.SelectedTilerIds?.Count > 0)
                _siteRepository.AddAOrUpdateSiteServiceProviderBridge(site.Id, ServiceTypes.Tiler, siteDto.SelectedTilerIds);

            if (siteDto.SelectedScopes?.Count > 0)
            {
                List<(int, int, string?)> mappedScopes = new();

                foreach (SiteScopeDTO scope in siteDto.SelectedScopes)
                {
                    mappedScopes.Add((scope.SiteScopeMasterId, scope.ScopeStatusId, scope.Remarks));
                }
                _siteScopeRepository.SaveScopes(site.Id, mappedScopes);
            }

            string addedByName = User?.Identity?.Name ?? "System";

            // Start email processing without waiting for SMTP to finish.
            _ = SiteAddedNotification(site, siteDto, addedByName);

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

            SiteDTO siteDto = _imapper.Map<Site, SiteDTO>(selectedSite);
            siteDto.SelectedMasterMasonIds = _siteRepository.GetServiceProviderIdsByTypes(id, new List<ServiceTypes> { ServiceTypes.MasterMasion });
            siteDto.SelectedElectricianIds = _siteRepository.GetServiceProviderIdsByTypes(id, new List<ServiceTypes> { ServiceTypes.Electrician });
            siteDto.SelectedLabourIds = _siteRepository.GetServiceProviderIdsByTypes(id, new List<ServiceTypes> { ServiceTypes.Labour });
            siteDto.SelectedPlumberIds = _siteRepository.GetServiceProviderIdsByTypes(id, new List<ServiceTypes> { ServiceTypes.Plumber });
            siteDto.SelectedPainterIds = _siteRepository.GetServiceProviderIdsByTypes(id, new List<ServiceTypes> { ServiceTypes.Painter });
            siteDto.SelectedCarpenterIds = _siteRepository.GetServiceProviderIdsByTypes(id, new List<ServiceTypes> { ServiceTypes.Carpenter });
            siteDto.SelectedTilerIds = _siteRepository.GetServiceProviderIdsByTypes(id, new List<ServiceTypes> { ServiceTypes.Tiler });

            List<SiteScope> scopes = _siteScopeRepository.Get(id);
            siteDto.Scopes = new List<SiteScopeDTO>();

            foreach (SiteScope scope in scopes)
            {
                SiteScopeDTO scopeVm = new()
                {
                    Id = scope.Id,
                    SiteScopeMasterId = scope.SiteScopeId,
                    ScopeName = scope.ScopeName,
                    ScopeStatusId = scope.ScopeStatusId,
                    StatusName = scope.StatusName,
                    Remarks = scope.Remarks,
                    CompletedDate = scope.CompletedDate
                };
                siteDto.Scopes.Add(scopeVm);
            }
            return Ok(siteDto);
        }

        // PUT api/Site/2
        [HttpPut(SiteAPIEnpoints.Update)]
        public async Task<IActionResult> Update(int id, [FromBody] SiteDTO siteDto)
        {
            _logger.LogInformation("API Action: Update | Invoked: {InvokedAt}", DateTime.Now.ToString("HH:mm:ss.fff"));
 
            if (siteDto == null || id <= 0)
                return BadRequest("Invalid site data.");
 
            // The id in the URL is the source of truth.
            siteDto.Id = id;
 
            Site oldSite = _siteRepository.GetSiteById(id);
 
            if (oldSite == null)
                return NotFound("Site not found");
 
            List<SiteScope> oldScopes = _siteScopeRepository.Get(id);
 
            Site site = _imapper.Map<SiteDTO, Site>(siteDto);
            int affectedRows = _siteRepository.Update(site);
 
            if (affectedRows <= 0)
                return StatusCode(500, "Site update failed.");
 
            // Save address.
            AddAddressIfPresent(site.Id, siteDto);
 
            // Save service provider assignments.
            _siteRepository.AddAOrUpdateSiteServiceProviderBridge(site.Id, ServiceTypes.MasterMasion, siteDto.SelectedMasterMasonIds ?? new List<int>());
            _siteRepository.AddAOrUpdateSiteServiceProviderBridge(site.Id, ServiceTypes.Electrician, siteDto.SelectedElectricianIds ?? new List<int>());
            _siteRepository.AddAOrUpdateSiteServiceProviderBridge(site.Id, ServiceTypes.Labour, siteDto.SelectedLabourIds ?? new List<int>());
            _siteRepository.AddAOrUpdateSiteServiceProviderBridge(site.Id, ServiceTypes.Plumber, siteDto.SelectedPlumberIds ?? new List<int>());
            _siteRepository.AddAOrUpdateSiteServiceProviderBridge(site.Id, ServiceTypes.Painter, siteDto.SelectedPainterIds ?? new List<int>());
            _siteRepository.AddAOrUpdateSiteServiceProviderBridge(site.Id, ServiceTypes.Carpenter, siteDto.SelectedCarpenterIds ?? new List<int>());
            _siteRepository.AddAOrUpdateSiteServiceProviderBridge(site.Id, ServiceTypes.Tiler, siteDto.SelectedTilerIds ?? new List<int>());
 
            // Save selected work scopes.
            List<(int, int, string?)> mappedScopes = new();
            List<SiteScopeDTO> selectedScopes = siteDto.SelectedScopes ?? new();
 
            foreach (SiteScopeDTO scope in selectedScopes)
            {
                mappedScopes.Add((scope.SiteScopeMasterId, scope.ScopeStatusId, scope.Remarks));
            }
 
            _siteScopeRepository.SaveScopes(site.Id, mappedScopes);
 
            // Refresh cached sites.
            _cache.Remove("AllSites");
 
            // Compare old and new data and send notification email.
            bool emailSent = await SendSiteUpdateEmail(siteDto, oldSite, oldScopes);
 
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

        private async Task SiteAddedNotification(Site site, SiteDTO siteDto, string addedByName)
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

            if (!string.IsNullOrWhiteSpace(siteDto.AddressLine1))
                siteAddress = siteDto.AddressLine1;

            if (!string.IsNullOrWhiteSpace(siteDto.CountryName))
            {
                if (siteAddress != "")
                    siteAddress += ", ";
                siteAddress += siteDto.CountryName;
            }

            if (siteDto.PinCode.HasValue)
            {
                if (siteAddress != "")
                    siteAddress += ", ";
                siteAddress += siteDto.PinCode.Value.ToString();
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

        private async Task<bool> SendSiteUpdateEmail(SiteDTO siteDto, Site oldSite, List<SiteScope> oldScopes)
        {
            if (oldSite == null)
                return false;

            List<SiteUpdateChange> changes = new();
            List<SiteScopeDTO> newScopes = siteDto.SelectedScopes ?? new();

            // Check site status.
            if (oldSite.SiteStatusId != siteDto.SiteStatusId)
            {
                string oldStatus = "Not Provided";
                string newStatus = "Not Provided";

                List<SiteStatus> allSiteStatuses = _siteStatusRepository.GetAll();

                foreach (SiteStatus status in allSiteStatuses)
                {
                    if (status.Id == oldSite.SiteStatusId)
                        oldStatus = status.Status ?? "Not Provided";

                    if (status.Id == siteDto.SiteStatusId)
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
            if (oldSite.ExpectedBudget != siteDto.ExpectedBudget)
            {
                changes.Add(new SiteUpdateChange
                {
                    FieldName = "Expected Budget",
                    OldValue = oldSite.ExpectedBudget.HasValue
                        ? $"₹{oldSite.ExpectedBudget.Value:N0}" : "Not Provided",
                    NewValue = siteDto.ExpectedBudget.HasValue
                        ? $"₹{siteDto.ExpectedBudget.Value:N0}" : "Not Provided"
                });
            }

            // Check removed scopes and changed scope statuses.
            List<SiteScopeStatus> allScopeStatuses = _siteScopeRepository.GetAllStatuses();
            foreach (SiteScope oldScope in oldScopes)
            {
                SiteScopeDTO? matchingScope = null;

                foreach (SiteScopeDTO newScope in newScopes)
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

            foreach (SiteScopeDTO newScope in newScopes)
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

            await _updateEmailService.SendAsync(siteDto.Name ?? oldSite.Name ?? "Unnamed Site",
                                                User?.Identity?.Name ?? "System", DateTime.Now, changes);

            return true;
        }

        private void AddAddressIfPresent(int siteId, SiteDTO siteDto)
        {
            if (!string.IsNullOrEmpty(siteDto.AddressLine1)
                || siteDto.AddressTypeId > 0
                || siteDto.CountryId > 0
                || siteDto.PinCode > 0)
            {
                Address address = new(0,
                    siteDto.AddressLine1,
                    siteDto.AddressTypeId ?? 0,
                    siteDto.CountryId ?? 0,
                    siteDto.PinCode ?? 0,
                    siteId);

                _addressRepository.Upsert(address);
            }
        }
    }
}
