using AutoMapper;
using BuilderLedger.API.ViewModels;
using BuilderLedger.Core.DataModels;
using BuilderLedger.Repository.Interfaces;
using BuilderLedger.API.APIControllers.ApiEndpoints;
using Microsoft.AspNetCore.Mvc;
using System.Text.RegularExpressions;

namespace BuilderLedger.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CostMasterController : ControllerBase
    {
        private readonly ICostMasterRepository _costMasterRepository;
        private readonly IServiceTypeRepository _serviceTypeRepository;
        private readonly ISiteRepository _siteRepository;
        private readonly IMapper _imapper;

        public CostMasterController(
             ICostMasterRepository costMasterRepository,
             IServiceTypeRepository serviceTypeRepository,
             ISiteRepository siteRepository)
        {
            _costMasterRepository = costMasterRepository;
            _serviceTypeRepository = serviceTypeRepository;
            _siteRepository = siteRepository;

            MapperConfiguration configuration = new(cfg =>
            {
                cfg.CreateMap<AddNewCostMasterVm, CostMaster>();
                cfg.CreateMap<CostMaster, CostMasterVm>();
                cfg.CreateMap<CostMaster, AddNewCostMasterVm>();
            });

            _imapper = configuration.CreateMapper();
        }

        // GET /api/CostMasterAPI?serviceTypeId=3
        [HttpGet(CostMasterAPIEnpoints.Index)]
        public IActionResult Index(int? serviceTypeId)
        {
            int siteId = GetSiteId();
            if (siteId <= 0)
                return BadRequest(new { message = "No site selected. Please select a site first." });

            List<ServiceType> serviceTypes = _serviceTypeRepository.GetAll();
            if (serviceTypes == null || !serviceTypes.Any())
                return NotFound(new { message = "No Service Types Found" });

            List<CostMaster> costMasters;
            int activeServiceTypeId = serviceTypeId.HasValue && serviceTypeId.Value > 0
                ? serviceTypeId.Value
                : serviceTypes.First().Id;

            costMasters = _costMasterRepository.GetByServiceType(activeServiceTypeId, siteId);

            var result = _imapper.Map<List<CostMasterVm>>(costMasters);

            return Ok(new
            {
                items = result,
                serviceTypes = serviceTypes.Select(s => new { s.Id, s.Name }),
                selectedServiceTypeId = activeServiceTypeId
            });
        }


        // GET /api/CostMasterAPI/GetActiveCost?serviceTypeId=3
        [HttpGet(CostMasterAPIEnpoints.GetActiveCost)]
        public IActionResult GetActiveCost(int serviceTypeId)
        {
            int siteId = GetSiteId();
            if (siteId <= 0)
                return BadRequest(new { message = "No site selected." });

            if (serviceTypeId <= 0)
                return BadRequest(new { message = "Invalid Service Type Id" });

            CostMaster costMaster = _costMasterRepository.GetActiveCostDetail(serviceTypeId, siteId);

            if (costMaster == null)
                return NotFound(new { message = "No Active Cost Found" });

            var result = _imapper.Map<CostMasterVm>(costMaster);
            return Ok(result);
        }

        // GET /api/CostMasterAPI/5
        [HttpGet(CostMasterAPIEnpoints.GetById)]
        public IActionResult GetById(int id)
        {
            int siteId = GetSiteId();
            if (siteId <= 0)
                return BadRequest(new { message = "No site selected." });

            CostMaster costMaster = _costMasterRepository.GetById(id, siteId);
            if (costMaster == null)
                return NotFound(new { message = "Cost Master record not found for the current site." });

            var result = _imapper.Map<AddNewCostMasterVm>(costMaster);
            return Ok(result);
        }

        // POST /api/CostMasterAPI
        [HttpPost(CostMasterAPIEnpoints.Add)]
        public IActionResult Add([FromBody] AddNewCostMasterVm costMasterVm)
        {
            int siteId = GetSiteId();
            if (siteId <= 0)
                return BadRequest(new { message = "No site selected." });

            if (costMasterVm == null)
                return BadRequest(new { message = "Invalid Data" });

            string validationMessage = ValidationDetail(costMasterVm);
            if (!string.IsNullOrEmpty(validationMessage))
                return BadRequest(new { message = validationMessage });

            costMasterVm.SiteId = siteId;

            CostMaster costMaster = _imapper.Map<AddNewCostMasterVm, CostMaster>(costMasterVm);
            int affectedRowCount = _costMasterRepository.Create(costMaster);

            if (affectedRowCount > 0)
                return Ok(new { message = "Add New Cost Master Successful" });

            return StatusCode(500, new { message = "Failed to insert record" });
        }

        // PUT /api/CostMasterAPI/5
        [HttpPut(CostMasterAPIEnpoints.Update)]
        public IActionResult Update(int id, [FromBody] AddNewCostMasterVm costMasterVm)
        {
            int siteId = GetSiteId();
            if (siteId <= 0)
                return BadRequest(new { message = "No site selected." });

            if (costMasterVm == null)
                return BadRequest(new { message = "Invalid Data" });

            string validationMessage = ValidationDetail(costMasterVm);
            if (!string.IsNullOrEmpty(validationMessage))
                return BadRequest(new { message = validationMessage });

            costMasterVm.Id = id;
            costMasterVm.SiteId = siteId;

            CostMaster costMaster = _imapper.Map<AddNewCostMasterVm, CostMaster>(costMasterVm);
            int affectedRowCount = _costMasterRepository.Update(costMaster);

            if (affectedRowCount > 0)
                return Ok(new { message = "Cost Master updated successfully." });

            return BadRequest(new { message = "Update failed. Record may not belong to the current site." });
        }

        // DELETE /api/CostMasterAPI/5
        [HttpDelete(CostMasterAPIEnpoints.Delete)]
        public IActionResult Delete(int id)
        {
            int siteId = GetSiteId();
            if (siteId <= 0)
                return BadRequest(new { message = "No site selected." });

            _costMasterRepository.Delete(id, siteId);
            return Ok(new { message = "Your Data Has Been Deleted successfully." });
        }

        // Site ID is sent from React as a header or query param since there's
        // no server-side session in a stateless API. We read it from the
        // "X-Site-Id" header set by the React axios interceptor.
        private int GetSiteId()
        {
            if (Request.Headers.TryGetValue("X-Site-Id", out var siteIdHeader)
                && int.TryParse(siteIdHeader, out var siteId))
            {
                return siteId;
            }
            return 0;
        }

        private string ValidationDetail(AddNewCostMasterVm costMasterVm)
        {
            if (costMasterVm.Date == null ||
                costMasterVm.Date == default(DateTime) ||
                costMasterVm.ServiceTypeId == 0)
            {
                return "Page not submitted, please enter correct Inputs";
            }

            if (costMasterVm.Cost == null || costMasterVm.Cost <= 0
                || !Regex.IsMatch(costMasterVm.Cost.Value.ToString("0.##"), @"^\d+(\.\d{1,2})?$"))
            {
                return "Cost must be a positive number with up to 2 decimal places and cannot contain alphabets or special characters.";
            }

            return string.Empty;
        }
    }
}
