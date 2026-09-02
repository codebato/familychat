import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isRegister) {
        await api.post("/api/auth/register", { username, password });
        setIsRegister(false);
        setError("Kayıt başarılı, şimdi giriş yapabilirsin.");
        return;
      }

      const res = await api.post("/api/auth/login", { username, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("username", res.data.username);
      navigate("/chat");
    } catch (err: any) {
      setError(err.response?.data ?? "Bir hata oluştu.");
    }
  };

  return (
    <div style={{ maxWidth: 300, margin: "100px auto" }}>
      <h2>{isRegister ? "Kayıt Ol" : "Giriş Yap"}</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Kullanıcı adı"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: 8 }}
        />
        <input
          placeholder="Şifre"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: 8 }}
        />
        <button type="submit" style={{ width: "100%" }}>
          {isRegister ? "Kayıt Ol" : "Giriş Yap"}
        </button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <p onClick={() => setIsRegister(!isRegister)} style={{ cursor: "pointer", color: "blue" }}>
        {isRegister ? "Zaten hesabın var mı? Giriş yap" : "Hesabın yok mu? Kayıt ol"}
      </p>
    </div>
  );
}