using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using FamilyChat.Api.Data;
using FamilyChat.Api.Models;
using WebPush;
using Microsoft.EntityFrameworkCore;

namespace FamilyChat.Api.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private static readonly Dictionary<int, string> _connections = new();

    public ChatHub(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    private int GetUserId() =>
        int.Parse(Context.User!.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    public override Task OnConnectedAsync()
    {
        _connections[GetUserId()] = Context.ConnectionId;
        return base.OnConnectedAsync();
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        _connections.Remove(GetUserId());
        return base.OnDisconnectedAsync(exception);
    }

    public async Task SendMessage(int receiverId, string content)
    {
        var senderId = GetUserId();

        var message = new Message
        {
            SenderId = senderId,
            ReceiverId = receiverId,
            Content = content
        };
        _db.Messages.Add(message);
        await _db.SaveChangesAsync();

        var isOnline = _connections.TryGetValue(receiverId, out var connectionId);

        if (isOnline)
        {
            await Clients.Client(connectionId!).SendAsync("ReceiveMessage", senderId, content, message.SentAt);
        }
        else
        {
            await SendPushNotification(senderId, receiverId, content);
        }
    }

    private async Task SendPushNotification(int senderId, int receiverId, string content)
    {
        var subscription = await _db.PushSubscriptions.FirstOrDefaultAsync(p => p.UserId == receiverId);
        if (subscription == null) return;

        var sender = await _db.Users.FindAsync(senderId);

        var pushSubscription = new WebPush.PushSubscription(subscription.Endpoint, subscription.P256dh, subscription.Auth);
        var vapidDetails = new VapidDetails(
            _config["VapidKeys:Subject"],
            _config["VapidKeys:PublicKey"],
            _config["VapidKeys:PrivateKey"]
        );

        var payload = System.Text.Json.JsonSerializer.Serialize(new
        {
            title = sender?.Username ?? "Yeni mesaj",
            body = content
        });

        var webPushClient = new WebPushClient();
        try
        {
            await webPushClient.SendNotificationAsync(pushSubscription, payload, vapidDetails);
        }
        catch (Exception)
        {
            // Abonelik geçersizse (örn. kullanıcı bildirimi kapatmışsa) sessizce geç
        }
    }
}
