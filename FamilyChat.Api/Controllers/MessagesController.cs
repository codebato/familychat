using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using FamilyChat.Api.Data;

namespace FamilyChat.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MessagesController : ControllerBase
{
    private readonly AppDbContext _db;

    public MessagesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("{otherUserId}")]
    public async Task<IActionResult> GetConversation(int otherUserId)
    {
        var myId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var messages = await _db.Messages
            .Where(m => (m.SenderId == myId && m.ReceiverId == otherUserId) ||
                        (m.SenderId == otherUserId && m.ReceiverId == myId))
            .OrderBy(m => m.SentAt)
            .ToListAsync();

        return Ok(messages);
    }
}