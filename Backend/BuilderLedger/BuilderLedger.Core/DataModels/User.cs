using BuilderLedger.Core.Enums;

namespace BuilderLedger.Core.DataModels
{
    public class User
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public GenderTypes Gender { get; set; }
        public string Email { get; set; }
        public string? Password { get; set; }
        public string Mobile { get; set; }
        public DateTime LastFailedLoginDate { get; set; }
        public DateTime LastSuccessFulLoginDate { get; set; }
        public int? LoginFailedCount { get; set; }
        public bool IsLocked { get; set; }
    }
}
