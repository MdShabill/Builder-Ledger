// Path: ConstructEase.WebApp/APIControllers/MaterialPurchaseAPIController.cs
using AutoMapper;
using BuilderLedger.API.APIControllers.ApiEndpoints;
using BuilderLedger.API.DTO;
using BuilderLedger.Core.DataModels;
using BuilderLedger.Repository.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Text.RegularExpressions;

namespace BuilderLedger.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MaterialPurchaseController : ControllerBase
    {
        private readonly IMaterialPurchaseRepository _materialPurchaseRepository;
        private readonly ISupplierRepository _supplierRepository;
        private readonly IMaterialRepository _materialRepository;
        private readonly IBrandRepository _brandRepository;
        private readonly IMapper _imapper;

        public MaterialPurchaseController(
            IMaterialPurchaseRepository materialPurchaseRepository,
            ISupplierRepository supplierRepository,
            IMaterialRepository materialRepository,
            IBrandRepository brandRepository)
        {
            _materialPurchaseRepository = materialPurchaseRepository;
            _supplierRepository = supplierRepository;
            _materialRepository = materialRepository;
            _brandRepository = brandRepository;

            var config = new MapperConfiguration(cfg =>
            {
                cfg.CreateMap<MaterialPurchaseDTO, MaterialPurchase>();
                cfg.CreateMap<MaterialPurchase, MaterialPurchaseDTO>();
            });
            _imapper = config.CreateMapper();
        }

        [HttpGet(MaterialPurchaseAPIEnpoints.Index)]
        public IActionResult Index(DateTime? dateFrom, DateTime? dateTo, int? materialId,
                                   int? supplierId, int? brandId)
        {
            int siteId = GetSiteId();
            if (siteId <= 0)
                return BadRequest(new { message = "No site selected." });

            List<MaterialPurchase> list = _materialPurchaseRepository.GetAll
                                   (siteId, dateFrom, dateTo, materialId, supplierId, brandId);

            var result = _imapper.Map<List<MaterialPurchaseDTO>>(list);

            return Ok(new { items = result, totalCount = result.Count });
        }

        //This API Should Shift Into MasterController
        [HttpGet(MaterialPurchaseAPIEnpoints.DropdownData)]
        public IActionResult GetDropdownData()
        {
            return Ok(new
            {
                suppliers = _supplierRepository.GetAll().Select(suppliers => new { id = suppliers.Id, name = suppliers.Name }),

                materials = _materialRepository.GetAll().Select(materials => new { id = materials.Id, name = materials.Name }),

                brands = _brandRepository.GetAll().Select(brands => new { id = brands.Id, name = brands.Name })
            });
        }

        [HttpGet(MaterialPurchaseAPIEnpoints.GetMaterialInfo)]
        public IActionResult GetMaterialInfo(int materialId)
        {
            if (materialId <= 0)
                return BadRequest(new { message = "Invalid material id" });

            Material material = _materialRepository.GetMaterialInfo(materialId);
            if (material == null)
                return NotFound(new { message = "Material not found" });

            return Ok(new
            {
                unitOfMeasure = material.UnitOfMeasure,
                unitPrice = material.UnitPrice
            });
        }

        [HttpPost(MaterialPurchaseAPIEnpoints.Add)]
        public IActionResult Add([FromBody] MaterialPurchaseDTO Dto)
        {
            int siteId = GetSiteId();
            if (siteId <= 0)
                return BadRequest(new { message = "No site selected." });

            string error = Validate(Dto);
            if (error != null)
                return BadRequest(new { message = error });

            var entity = _imapper.Map<MaterialPurchase>(Dto);
            entity.SiteId = siteId;

            int rows = _materialPurchaseRepository.Create(entity);
            if (rows > 0)
                return Ok(new { message = "Added successfully in Material Purchase" });

            return StatusCode(500, new { message = "Failed to insert record" });
        }

        [HttpDelete(MaterialPurchaseAPIEnpoints.Delete)]
        public IActionResult Delete(int id)
        {
            if (id <= 0)
                return BadRequest(new { message = "Invalid id" });

            _materialPurchaseRepository.Delete(id);
            return Ok(new { message = "Your Data Has Been Deleted successfully." });
        }

        private string Validate(MaterialPurchaseDTO vm)
        {
            if (vm.MaterialId <= 0 || vm.SupplierId <= 0 || vm.BrandId <= 0
                || vm.Quantity <= 0 || string.IsNullOrEmpty(vm.UnitOfMeasure)
                || vm.Date == default || vm.Date > DateTime.Now
                || vm.MaterialCost <= 0 || vm.DeliveryCharge < 0)
                return "Please provide valid input for all required fields.";

            if (string.IsNullOrEmpty(vm.PhoneNumber)
                || vm.PhoneNumber.Length != 10 || !Regex.IsMatch(vm.PhoneNumber, @"^\d{10}$"))
                return "Supplier Phone Number must be numeric and exactly 10 digits long.";

            if (!Regex.IsMatch(vm.Quantity.ToString(), @"^\d+$"))
                return "Quantity must be a positive integer.";

            if (!Regex.IsMatch(vm.DeliveryCharge.ToString("0.##"), @"^\d+(\.\d{1,2})?$"))
                return "Delivery Charge must be a non-negative decimal value.";

            return null;
        }

        private int GetSiteId()
        {
            if (Request.Headers.TryGetValue("X-Site-Id", out var val)
                && int.TryParse(val, out var id))
                return id;
            return 0;
        }
    }
}
