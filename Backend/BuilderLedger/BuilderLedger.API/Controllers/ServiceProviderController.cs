using AutoMapper;
using BuilderLedger.API.APIControllers.ApiEndpoints;
using BuilderLedger.API.DTO;
using BuilderLedger.Core.DataModels;
using BuilderLedger.Repository.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Text.RegularExpressions;
using System.Transactions;

namespace BuilderLedger.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ServiceProviderController : ControllerBase
    {
        private readonly IServiceProviderRepository _serviceProviderRepository;
        private readonly IServiceTypeRepository _serviceTypeRepository;
        private readonly IAddressRepository _addressRepository;
        private readonly IAddressTypeRepository _addressTypeRepository;
        private readonly ICountryRepository _countryRepository;
        private readonly IDailyAttendanceRepository _dailyAttendanceRepository;
        private readonly IMapper _imapper;

        public ServiceProviderController(
            IServiceProviderRepository serviceProviderRepository,
            IServiceTypeRepository serviceTypeRepository,
            IAddressRepository addressRepository,
            IAddressTypeRepository addressTypeRepository,
            ICountryRepository countryRepository,
            IDailyAttendanceRepository dailyAttendanceRepository)
        {
            _serviceProviderRepository = serviceProviderRepository;
            _serviceTypeRepository = serviceTypeRepository;
            _addressRepository = addressRepository;
            _addressTypeRepository = addressTypeRepository;
            _countryRepository = countryRepository;
            _dailyAttendanceRepository = dailyAttendanceRepository;

            var config = new MapperConfiguration(cfg =>
            {
                cfg.CreateMap<ServiceProviderDTO, Core.DataModels.ServiceProvider>();
                cfg.CreateMap<Core.DataModels.ServiceProvider, ServiceProviderDTO>();
            });

            _imapper = config.CreateMapper();
        }

        [HttpGet(ServiceProviderAPIEnpoints.Index)]
        public IActionResult Index(int? serviceTypeId, int? id)
        {
            List<Core.DataModels.ServiceProvider> serviceProviders =
            _serviceProviderRepository.GetAll(serviceTypeId, id);
            var serviceProviderDto = _imapper.Map<List<Core.DataModels.ServiceProvider>,
            List<ServiceProviderDTO>>(serviceProviders);
            return Ok(new { items = serviceProviderDto, totalCount = serviceProviderDto.Count });
        }

        [HttpGet(ServiceProviderAPIEnpoints.GetById)]
        public IActionResult GetById(int id)
        {
            List<Core.DataModels.ServiceProvider> serviceProviders = _serviceProviderRepository.GetAll(null, id);
            if (serviceProviders.Count == 0)
                return NotFound(new { message = "Service Provider not found" });

            var serviceProviderDto = _imapper.Map<ServiceProviderDTO>(serviceProviders.First());
            return Ok(serviceProviderDto);
        }

        [HttpPost(ServiceProviderAPIEnpoints.Add)]
        public IActionResult Add([FromBody] ServiceProviderDTO serviceProviderDto)
        {
            string error = Validate(serviceProviderDto);
            if (error != null)
                return BadRequest(new { message = error });

            Core.DataModels.ServiceProvider serviceProvider =
                _imapper.Map<ServiceProviderDTO, Core.DataModels.ServiceProvider>(serviceProviderDto);

            serviceProvider.ServiceProviderId = _serviceProviderRepository.Add(serviceProvider);

            if (serviceProvider.ServiceProviderId > 0)
            {
                AddAddressIfPresent(serviceProvider.ServiceProviderId, serviceProviderDto);
                return Ok(new { message = "Your ServiceProvider Data Added successfully." });
            }

            return StatusCode(500, new { message = "Failed to insert record" });
        }

        [HttpPut(ServiceProviderAPIEnpoints.Update)]
        public IActionResult Update(int id, [FromBody] ServiceProviderDTO serviceProviderDto)
        {
            string error = Validate(serviceProviderDto);
            if (error != null)
                return BadRequest(new { message = error });

            serviceProviderDto.ServiceProviderId = id;

            Core.DataModels.ServiceProvider serviceProvider =
                _imapper.Map<ServiceProviderDTO, Core.DataModels.ServiceProvider>(serviceProviderDto);

            int affectedRowCount = _serviceProviderRepository.Update(serviceProvider);
            if (affectedRowCount > 0)
            {
                AddAddressIfPresent(id, serviceProviderDto);
                return Ok(new { message = "Your Data updated successfully." });
            }
            return BadRequest(new { message = "Update failed." });
        }

        [HttpDelete(ServiceProviderAPIEnpoints.Delete)]
        public IActionResult Delete(int id)
        {
            using var transaction = new TransactionScope();
            try
            {
                _addressRepository.Delete(id, null);
                _dailyAttendanceRepository.Delete(id);
                _serviceProviderRepository.Delete(id);
                transaction.Complete();
                return Ok(new { message = "Your Data Has Been Deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        //This API Should Shift Into MasterController
        [HttpGet(ServiceProviderAPIEnpoints.DropdownData)]
        public IActionResult GetDropdownData()
        {
            return Ok(new
            {
                serviceTypes = _serviceTypeRepository.GetAll()
                    .Select(s => new { id = s.Id, name = s.Name }),

                addressTypes = _addressTypeRepository.GetAll()
                    .Select(a => new { id = a.Id, name = a.Name }),

                countries = _countryRepository.GetAllCountries()
                    .Select(c => new { id = c.Id, name = c.Name })
            });
        }

        private void AddAddressIfPresent(int serviceProviderId, ServiceProviderDTO serviceProviderDto)
        {
            if (!string.IsNullOrEmpty(serviceProviderDto.AddressLine1) ||
                serviceProviderDto.AddressTypeId.HasValue && serviceProviderDto.AddressTypeId > 0 ||
                serviceProviderDto.CountryId.HasValue && serviceProviderDto.CountryId > 0 ||
                serviceProviderDto.PinCode.HasValue && serviceProviderDto.PinCode > 0)
            {
                var address = new Address(
                    serviceProviderId,
                    serviceProviderDto.AddressLine1,
                    serviceProviderDto.AddressTypeId ?? 0,
                    serviceProviderDto.CountryId ?? 0,
                    serviceProviderDto.PinCode ?? 0,
                    serviceProviderDto.SiteId
                );
                _addressRepository.Upsert(address);
            }
            else
                _addressRepository.Delete(serviceProviderId, null);
        }

        private string Validate(ServiceProviderDTO serviceProviderDto)
        {
            if (string.IsNullOrEmpty(serviceProviderDto.ServiceProviderName))
                return "Service Provider Name is required.";

            if (serviceProviderDto.ServiceProviderName.Length > 15 || serviceProviderDto.ServiceProviderName.Length < 4 ||
                !Regex.IsMatch(serviceProviderDto.ServiceProviderName, @"^[a-zA-Z\s]+$"))
                return "Service Provider Name must be between 4 to 15 characters and contain only alphabets.";

            if (serviceProviderDto.DOB == null || serviceProviderDto.DOB > DateTime.Now)
                return "Date Of Birth cannot be null or in the future.";

            if (string.IsNullOrEmpty(serviceProviderDto.MobileNumber) || serviceProviderDto.MobileNumber.Length != 10 ||
                !Regex.IsMatch(serviceProviderDto.MobileNumber, @"^\d{10}$"))
                return "Mobile Number must be numeric and exactly 10 digits long.";

            if (string.IsNullOrEmpty(serviceProviderDto.ReferredBy))
                return "Referred name is required.";

            if (serviceProviderDto.ReferredBy.Length > 15 || serviceProviderDto.ReferredBy.Length < 3 ||
                !Regex.IsMatch(serviceProviderDto.ReferredBy, @"^[a-zA-Z\s]+$"))
                return "Referred name must be between 3 to 15 characters and contain only alphabets.";

            if (serviceProviderDto.ServiceTypeId == 0)
                return "Job Category is required.";

            return null;
        }
    }
}
