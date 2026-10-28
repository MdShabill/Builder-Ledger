using System.Diagnostics.CodeAnalysis;

namespace BuilderLedger.API.ViewModels
{
    public class UserVm
    {
        public string Email { get; set; }
        public string Password { get; set; }
        public string? FullName { get; internal set; }
    }
}
