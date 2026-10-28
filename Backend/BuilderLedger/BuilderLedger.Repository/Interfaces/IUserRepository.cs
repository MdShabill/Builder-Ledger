using BuilderLedger.Core.DataModels;

namespace BuilderLedger.Repository.Interfaces
{
    public interface IUserRepository
    {
        public User GetUserDetailByEmail(string email);
        public void UpdateOnLoginSuccessful(string email);
        public void UpdateOnLoginFailed(string email);
        public void UpdateIsLocked(string email, bool isLocked = true);
    }
}
