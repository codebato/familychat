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
  <div className="auth-shell">
    <div className="auth-card">
      <h1 className="auth-title brand">{isRegister ? "Kayıt Ol" : "FamilyChat"}</h1>
      <p className="auth-subtitle">{isRegister ? "Yeni bir hesap oluştur" : "Ailenle konuşmaya devam et"}</p>
      <form onSubmit={handleSubmit}>
        <input
          className="field"
          placeholder="Kullanıcı adı"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="field"
          placeholder="Şifre"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="btn-primary" type="submit">
          {isRegister ? "Kayıt Ol" : "Giriş Yap"}
        </button>
      </form>
      {error && <p className="auth-error">{error}</p>}
      <p className="auth-toggle" onClick={() => setIsRegister(!isRegister)}>
        {isRegister ? "Zaten hesabın var mı? Giriş yap" : "Hesabın yok mu? Kayıt ol"}
      </p>
    </div>
  </div>
)}