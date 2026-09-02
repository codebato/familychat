import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { api, subscribeToPush } from "./api";


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
    <div style={{ display: "flex", maxWidth: 700, margin: "40px auto" }}>
      <div style={{ width: 150, borderRight: "1px solid #ccc", paddingRight: 10 }}>
        <h4>Merhaba, {myUsername}</h4>
        {users.map((u) => (
          <div
            key={u.id}
            onClick={() => selectUser(u)}
            style={{
              padding: 8,
              cursor: "pointer",
              background: selectedUser?.id === u.id ? "#ddd" : "transparent",
            }}
          >
            {u.username}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, paddingLeft: 20 }}>
        {selectedUser ? (
          <>
            <h4>{selectedUser.username} ile sohbet</h4>
            <div style={{ border: "1px solid #ccc", height: 300, overflowY: "auto", padding: 10, marginBottom: 10 }}>
              {messages.map((m) => (
                <div key={m.id}>
                  <b>{m.senderId === 0 ? "Ben" : selectedUser.username}:</b> {m.content}
                </div>
              ))}
            </div>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Mesaj yaz..." />
            <button onClick={sendMessage}>Gönder</button>
          </>
        ) : (
          <p>Sohbet etmek için soldan birini seç.</p>
        )}
      </div>
    </div>
  );
}