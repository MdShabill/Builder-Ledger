using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BuilderLedger.Core.DataModels
{
    public class CostMaster
    {
        public int Id { get; set; }
        public int ServiceTypeId { get; set; }
        public int? SiteId { get; set; }
        public string Name { get; set; }
        public decimal Cost { get; set; }
        public DateTime Date { get; set; }
    }
}
