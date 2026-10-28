using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BuilderLedger.Core.DataModels
{
    public class MaterialPurchase
    {
        public int Id { get; set; }
        public int MaterialId { get; set; }
        public string MaterialName { get; set; }
        public int SupplierId { get; set; }
        public string SupplierName { get; set; }
        public int SiteId { get; set; }
        public string SiteName { get; set; }
        public string PhoneNumber { get; set; }
        public int BrandId { get; set; }
        public string BrandName { get; set; }
        public int Quantity { get; set; }
        public string UnitOfMeasure { get; set; }
        public decimal UnitPrice { get; set; }
        public DateTime Date { get; set; }
        public decimal MaterialCost { get; set; }
        public decimal DeliveryCharge { get; set; }
    }
}
