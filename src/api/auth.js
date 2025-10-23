import axios from "axios";

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const telegramLogin = (initData) => API.post("/auth/telegram", { initData });
export const getUser = (token) =>
  API.get("/auth/me", { headers: { Authorization: `Bearer ${token}` } });
