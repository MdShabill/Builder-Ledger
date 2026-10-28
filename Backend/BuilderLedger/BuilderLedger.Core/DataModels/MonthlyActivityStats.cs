using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BuilderLedger.Core.DataModels
{
    public class MonthlyActivityStats
    {
        public decimal MonthlySpend { get; set; }
        public int MonthlyPurchases { get; set; }
        public int MonthlyAttendance { get; set; }
    }
}
