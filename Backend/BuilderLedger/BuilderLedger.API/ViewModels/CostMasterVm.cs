using System.ComponentModel.DataAnnotations;

namespace BuilderLedger.API.ViewModels
{
    public class CostMasterVm
    {
        public int Id { get; set; }
        public int ServiceTypeId { get; set; }
        public string Name { get; set; }
        public decimal Cost { get; set; }
        public DateTime Date { get; set; }
        public bool IsActive { get; set; }
    }

    public class AddNewCostMasterVm
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "ServiceTypes is invalid")]
        public int? ServiceTypeId { get; set; }

        [Required(ErrorMessage = "Cost is invalid")]
        public decimal? Cost { get; set; }

        [Required(ErrorMessage = "Date is invalid")]
        public DateTime? Date { get; set; }
        public int? SiteId { get; set; }
    }
}
