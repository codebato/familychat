using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using FamilyChat.Api.Data;
using FamilyChat.Api.Models;

namespace FamilyChat.Api.Controllers;

public record SubscriptionRequest(string Endpoint, string P256dh, string Auth);

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PushController : ControllerBase
{
    private readonly AppDbContext _db;

    public PushController(AppDbContext db)
    {
        _db = db;
    }

    [HttpPost("subscribe")]
    public async Task<IActionResult> Subscribe(SubscriptionRequest request)
    {
        var myId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var existing = await _db.PushSubscriptions.FirstOrDefaultAsync(p => p.UserId == myId);
        if (existing != null)
        {
            existing.Endpoint = request.Endpoint;
            existing.P256dh = request.P256dh;
            existing.Auth = request.Auth;
        }
        else
        {
            _db.PushSubscriptions.Add(new PushSubscription
            {
                UserId = myId,
                Endpoint = request.Endpoint,
                P256dh = request.P256dh,
                Auth = request.Auth
            });
        }

        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpGet("vapid-public-key")]
    [AllowAnonymous]
    public IActionResult GetVapidPublicKey([FromServices] IConfiguration config)
    {
        return Ok(config["VapidKeys:PublicKey"]);
    }
}