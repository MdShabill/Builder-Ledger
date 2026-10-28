using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BuilderLedger.Core.DataModels
{
    public class DailyAttendance
    {
        public int Id { get; set; }
        public DateTime Date { get; set; }
        public int ServiceTypeId { get; set; }
        public int SiteId { get; set; }
        public string SiteName { get; set; }
        public int ServiceProviderId { get; set; }
        public string ServiceProviderName { get; set; }
        public string Name { get; set; }
        public int TotalWorker { get; set; }
        public decimal AmountPerWorker { get; set; }
        public decimal TotalAmount { get; set; }
        public string Notes { get; set; }
    }
}
