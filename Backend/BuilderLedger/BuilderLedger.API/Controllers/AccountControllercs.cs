using AutoMapper;
using BuilderLedger.API.APIControllers.ApiEndpoints;
using BuilderLedger.API.DTO;
using BuilderLedger.Core.DataModels;
using BuilderLedger.Repository.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BuilderLedger.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        private readonly IMapper _imapper;
        private readonly ILogger<AccountController> _logger;

        public AccountController(IUserRepository userRepository, ILogger<AccountController> logger)
        {
            _userRepository = userRepository;
            _logger = logger;

            var configuration = new MapperConfiguration(cfg =>
            {
                cfg.CreateMap<User, UserDTO>();
            });

            _imapper = configuration.CreateMapper();
        }


        [HttpPost(AccountAPIEndpoints.Login)]
        public IActionResult Login(UserDTO userDto)
        {
            _logger.LogInformation("API Action: Login | Invoked: {Time}", DateTime.Now.ToString("HH:mm:ss.fff"));

            if (userDto == null || string.IsNullOrWhiteSpace(userDto.Email)
                || string.IsNullOrWhiteSpace(userDto.Password))
                return BadRequest("Email and password are required.");

            User user = _userRepository.GetUserDetailByEmail(userDto.Email);
            if (user == null)
                return Unauthorized("Invalid Email Or Password.");

            if (user.IsLocked)
                return StatusCode(StatusCodes.Status423Locked, "Your account has been locked. Kindly contact the administrator.");

            if (user.Password != userDto.Password)
            {
                _userRepository.UpdateOnLoginFailed(userDto.Email);

                if (user.LoginFailedCount >= 2)
                {
                    _userRepository.UpdateIsLocked(userDto.Email, true);

                    return StatusCode(StatusCodes.Status423Locked, "Your account has been locked. Kindly contact the administrator.");
                }
                return Unauthorized("Invalid Email Or Password.");
            }
            _userRepository.UpdateOnLoginSuccessful(userDto.Email);

            return Ok(new UserDTO { FullName = user.Name, Email = user.Email });
        }
    }
}
