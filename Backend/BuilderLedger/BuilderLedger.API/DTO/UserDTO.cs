namespace BuilderLedger.API.DTO
{
    public class UserDTO
    {
        public string Email { get; set; }
        public string Password { get; set; }
        public string? FullName { get; internal set; }
    }
}
