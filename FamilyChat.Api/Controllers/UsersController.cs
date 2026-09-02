using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using FamilyChat.Api.Data;

namespace FamilyChat.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;

    public UsersController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        var myId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var users = await _db.Users
            .Where(u => u.Id != myId)
            .Select(u => new { u.Id, u.Username })
            .ToListAsync();

        return Ok(users);
    }
}