// Path: ConstructEase.WebApp/APIControllers/DailyAttendanceAPIController.cs
using AutoMapper;
using BuilderLedger.API.APIControllers.ApiEndpoints;
using BuilderLedger.API.ViewModels;
using BuilderLedger.Core.DataModels;
using BuilderLedger.Repository.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Text.RegularExpressions;

namespace BuilderLedger.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DailyAttendanceController : ControllerBase
    {
        private readonly IDailyAttendanceRepository _dailyAttendanceRepository;
        private readonly ICostMasterRepository _costMasterRepository;
        private readonly IServiceTypeRepository _serviceTypeRepository;
        private readonly IServiceProviderRepository _serviceProviderRepository;
        private readonly IMapper _imapper;

        public DailyAttendanceController(
            IDailyAttendanceRepository dailyAttendanceRepository,
            ICostMasterRepository costMasterRepository,
            IServiceTypeRepository serviceTypeRepository,
            IServiceProviderRepository serviceProviderRepository)
        {
            _dailyAttendanceRepository = dailyAttendanceRepository;
            _costMasterRepository = costMasterRepository;
            _serviceTypeRepository = serviceTypeRepository;
            _serviceProviderRepository = serviceProviderRepository;

            MapperConfiguration configuration = new(cfg =>
            {
                cfg.CreateMap<DailyAttendanceVm, DailyAttendance>();
                cfg.CreateMap<DailyAttendance, DailyAttendanceVm>();
            });
            _imapper = configuration.CreateMapper();
        }

        // GET /api/DailyAttendanceAPI?dateFrom=2023-01-01&dateTo=2023-12-31
        [HttpGet(DilyAttendanceAPIEnpoints.Index)]
        public IActionResult Index([FromQuery] DateTime? dateFrom, [FromQuery] DateTime? dateTo)
        {
            int siteId = GetSiteId();
            if (siteId <= 0)
                return BadRequest(new { message = "No site selected. Please select a site first." });

            List<DailyAttendance> dailyAttendances = _dailyAttendanceRepository.GetAll(siteId, dateFrom, dateTo);
            var result = _imapper.Map<List<DailyAttendanceVm>>(dailyAttendances);

            return Ok(result);
        }

        // GET /api/DailyAttendanceAPI/GetCostByServiceType?serviceTypeId=3
        [HttpGet(DilyAttendanceAPIEnpoints.GetCostByServiceType)]
        public IActionResult GetCostByServiceType(int serviceTypeId = 0)
        {
            int siteId = GetSiteId();
            if (siteId <= 0)
                return BadRequest(new { message = "No site selected." });

            if (serviceTypeId > 0)
            {
                CostMaster costMaster = _costMasterRepository.GetActiveCostDetail(serviceTypeId, siteId);

                var serviceProviders = _serviceProviderRepository.GetAll(serviceTypeId, null)
                    .Where(c => c.ServiceTypeId == serviceTypeId)
                    .Select(sp => new {
                        serviceProviderId = sp.ServiceProviderId,
                        serviceProviderName = sp.ServiceProviderName
                    }).ToList();

                return Ok(new { cost = costMaster?.Cost ?? 0, serviceProviders });
            }

            return Ok(new { cost = 0, serviceProviders = new List<object>() });
        }

        // GET /api/DailyAttendanceAPI/dropdown-data
        // Mirrors DropDownSelectList() — service types + cost per type for auto-fill
        [HttpGet(DilyAttendanceAPIEnpoints.GetDropdownData)]
        public IActionResult GetDropdownData()
        {
            int siteId = GetSiteId();
            if (siteId <= 0)
                return BadRequest(new { message = "No site selected." });

            List<ServiceType> serviceTypes = _serviceTypeRepository.GetAll();

            var serviceTypeCosts = serviceTypes.Select(st => new
            {
                serviceTypeId = st.Id,
                serviceTypeName = st.Name,
                cost = _costMasterRepository.GetActiveCostDetail(st.Id, siteId)?.Cost ?? 0
            }).ToList();

            return Ok(new
            {
                serviceTypes = serviceTypes.Select(s => new { id = s.Id, name = s.Name }),
                serviceTypeCosts
            });
        }

        // POST /api/DailyAttendanceAPI
        [HttpPost(DilyAttendanceAPIEnpoints.Add)]
        public IActionResult Add([FromBody] DailyAttendanceVm dailyAttendanceVm)
        {
            int siteId = GetSiteId();
            if (siteId <= 0)
                return BadRequest(new { message = "No site selected." });

            string validationMessage = ValidateDailyAttendance(dailyAttendanceVm);
            if (validationMessage != null)
                return BadRequest(new { message = validationMessage });

            DailyAttendance dailyAttendance = _imapper.Map<DailyAttendanceVm, DailyAttendance>(dailyAttendanceVm);
            dailyAttendance.SiteId = siteId;

            CostMaster costMaster = _costMasterRepository.GetActiveCostDetail(dailyAttendanceVm.ServiceTypeId, siteId);

            if (costMaster == null)
                return BadRequest(new { message = "No active CostMaster record found" });

            dailyAttendance.AmountPerWorker = costMaster.Cost;
            dailyAttendance.TotalAmount = dailyAttendance.TotalWorker * costMaster.Cost;

            dailyAttendance.Id = _dailyAttendanceRepository.Create(dailyAttendance);

            if (dailyAttendance.Id > 0)
                return Ok(new { message = "Add New Daily Attendance Successful" });

            return StatusCode(500, new { message = "Failed to insert record" });
        }

        private string ValidateDailyAttendance(DailyAttendanceVm vm)
        {
            if (vm.ServiceTypeId == 0)
                return "Please select a Job Category.";

            if (vm.TotalWorker <= 0)
                return "Please enter a valid number of Total Workers.";

            if (vm.Date > DateTime.Now)
                return "Date cannot be in the future.";

            string totalWorkerPattern = @"^\d+$";
            if (!Regex.IsMatch(vm.TotalWorker.ToString(), totalWorkerPattern))
                return "Total Worker must be a valid positive number and cannot contain any special characters or alphabets.";

            return null;
        }

        // Site comes from React header (no server session in stateless API)
        private int GetSiteId()
        {
            if (Request.Headers.TryGetValue("X-Site-Id", out var siteIdHeader)
                && int.TryParse(siteIdHeader, out var siteId))
            {
                return siteId;
            }
            return 0;
        }
    }
}
