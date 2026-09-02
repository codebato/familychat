import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import Chat from "./Chat";

function App() {
  const isLoggedIn = !!localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/chat" element={isLoggedIn ? <Chat /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;