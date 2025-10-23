import axios from "axios";

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const getWallet = (token) =>
  API.get("/wallet", { headers: { Authorization: `Bearer ${token}` } });

export const depositWallet = (amount, token) =>
  API.post("/wallet/deposit", { amount }, { headers: { Authorization: `Bearer ${token}` } });

export const withdrawWallet = (amount, token) =>
  API.post("/wallet/withdraw", { amount }, { headers: { Authorization: `Bearer ${token}` } });
