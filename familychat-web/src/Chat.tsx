import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { api, subscribeToPush } from "./api";
import { avatarColor } from "./avatarColor";

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  sentAt: string;
}

interface UserItem {
  id: number;
  username: string;
}

const API_URL = "https://familychat-production-494a.up.railway.app";

export default function Chat() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const myUsername = localStorage.getItem("username");

  useEffect(() => {
    api.get("/api/users").then((res) => setUsers(res.data));
    subscribeToPush().catch(console.error);

    const token = localStorage.getItem("token");
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_URL}/chathub?access_token=${token}`)
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveMessage", (senderId: number, content: string, sentAt: string) => {
      setMessages((prev) => [...prev, { id: Date.now(), senderId, receiverId: 0, content, sentAt }]);
    });

    connection.start().catch(console.error);
    connectionRef.current = connection;

    return () => {
      connection.stop();
    };
  }, []);

  const selectUser = async (user: UserItem) => {
    setSelectedUser(user);
    const res = await api.get(`/api/messages/${user.id}`);
    setMessages(res.data);
  };

  const sendMessage = async () => {
    if (!text.trim() || !selectedUser) return;
    await connectionRef.current?.invoke("SendMessage", selectedUser.id, text);
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), senderId: 0, receiverId: selectedUser.id, content: text, sentAt: new Date().toISOString() },
    ]);
    setText("");
  };

return (
  <div className="app-shell">
    <div className="sidebar">
      <div className="sidebar-header">
        <p className="brand">FamilyChat</p>
        <p className="me">{myUsername}</p>
      </div>
      <div className="contact-list">
        {users.map((u) => (
          <div
            key={u.id}
            className={`contact-item ${selectedUser?.id === u.id ? "active" : ""}`}
            onClick={() => selectUser(u)}
          >
            <div className="avatar" style={{ background: avatarColor(u.username) }}>
              {u.username[0].toUpperCase()}
            </div>
            <span className="contact-name">{u.username}</span>
          </div>
        ))}
      </div>
    </div>

    <div className="chat-panel">
      {selectedUser ? (
        <>
          <div className="chat-header">
            <div className="avatar" style={{ background: avatarColor(selectedUser.username) }}>
              {selectedUser.username[0].toUpperCase()}
            </div>
            <span className="name">{selectedUser.username}</span>
          </div>

          <div className="messages">
            {messages.map((m) => (
              <div key={m.id} className={`bubble-row ${m.senderId === 0 ? "mine" : ""}`}>
                <div className={`bubble ${m.senderId === 0 ? "sent" : "received"}`}>
                  {m.content}
                </div>
              </div>
            ))}
          </div>

          <div className="composer">
            <input
              className="field"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Mesaj yaz..."
            />
            <button className="btn-send" onClick={sendMessage}>Gönder</button>
          </div>
        </>
      ) : (
        <div className="empty-state">Sohbet etmek için soldan birini seç.</div>
      )}
    </div>
  </div>
)};