import axios from "axios";

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const createRoom = (stake, mode, token) =>
  API.post("/rooms/create", { stake, mode }, { headers: { Authorization: `Bearer ${token}` } });

export const joinRoom = (roomId, token) =>
  API.post("/rooms/join", { roomId }, { headers: { Authorization: `Bearer ${token}` } });

export const listRooms = (stake, mode) =>
  API.get(`/rooms?stake=${stake}&mode=${mode}`);
