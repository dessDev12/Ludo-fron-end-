import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { telegramLogin } from "../api/auth";

export default function Login() {
  const { login } = useContext(AuthContext);

  const handleTelegramLogin = async () => {
    const initData = window.Telegram.WebApp.initData;
    const res = await telegramLogin(initData);
    login(res.data.token, res.data.user);
  };

  return (
    <div>
      <h1>Ludo Login</h1>
      <button onClick={handleTelegramLogin}>Login with Telegram</button>
    </div>
  );
}
