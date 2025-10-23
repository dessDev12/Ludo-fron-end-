// src/hooks/useSocket.js
import { useState, useEffect } from "react";
import { io } from "socket.io-client";

export const useSocket = (navigate) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState("connecting");
  const [availableRooms, setAvailableRooms] = useState([]);
  const [joinedRoom, setJoinedRoom] = useState(null);
  const [joinedUsers, setJoinedUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [dice, setDice] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    const s = io("http://localhost:5000/ludo", {
      transports: ["polling"],
      transportOptions: { polling: { extraHeaders: { Authorization: `Bearer ${token}` } } },
    });

    setSocket(s);

    s.on("connect", () => setConnected("connected"));
    s.on("disconnect", () => setConnected("not connected"));
    s.on("connect_error", () => setConnected("not connected"));

    s.on("rooms:list", setAvailableRooms);
    s.on("room:create", (room) => {
      setAvailableRooms((prev) => [...prev, room]);
      setMessages((prev) => [...prev, `Room created: ${room.roomId}`]);
    });

    s.on("room:update", (room) => {
      if (joinedRoom?.roomId === room.roomId) setJoinedUsers(room.players);
      setJoinedRoom((prev) => (prev?.roomId === room.roomId ? room : prev));
      setAvailableRooms((prev) => prev.map((r) => (r.roomId === room.roomId ? room : r)));
    });

    s.on("game:start", ({ gameId }) => {
      setMessages((prev) => [...prev, `Game started: ${gameId}`]);
      setJoinedRoom((prev) => prev ? { ...prev, gameId } : { gameId });
    });

    s.on("dice:result", ({ userId, value }) => {
      setDice(value);
      setMessages((prev) => [...prev, `User ${userId} rolled ${value}`]);
    });

    s.emit("rooms:list");

    return () => s.disconnect();
  }, [navigate, joinedRoom?.roomId]);

  return {
    socket,
    connected,
    availableRooms,
    joinedRoom,
    joinedUsers,
    messages,
    dice,
    setJoinedRoom,
    setJoinedUsers,
    setMessages,
    setDice,
  };
};
