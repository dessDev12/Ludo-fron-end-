import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";

export const useLudoSocket = (token, navigate) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState("connecting");
  const [joinedRoom, setJoinedRoom] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [joinedUsers, setJoinedUsers] = useState([]);
  const [dice, setDice] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!token) return navigate("/login");

    const s = io("http://localhost:5000/ludo", {
      transports: ["polling"],
      transportOptions: { polling: { extraHeaders: { Authorization: `Bearer ${token}` } } },
    });

    setSocket(s);

    s.on("connect", () => setConnected("connected"));
    s.on("disconnect", () => setConnected("not connected"));
    s.on("connect_error", () => setConnected("not connected"));

    s.on("rooms:list", (rooms) => setAvailableRooms(rooms));

    s.on("room:create", (room) => {
      setAvailableRooms((prev) => [...prev, room]);
      setMessages((prev) => [...prev, `Room created: ${room.roomId}`]);
    });

    s.on("room:update", (room) => {
      if (joinedRoom?.roomId === room.roomId) {
        setJoinedUsers(room.players);
        setJoinedRoom(room);
      }
      setAvailableRooms((prev) =>
        prev.map((r) => (r.roomId === room.roomId ? room : r))
      );
    });

    s.on("game:start", ({ gameId, gameState }) => {
      setMessages((prev) => [...prev, `Game started: ${gameId}`]);
      setJoinedRoom((prev) => (prev ? { ...prev, gameId } : { gameId, ...gameState }));
    });

    s.on("dice:result", ({ userId, value }) => {
      setDice(value);
      setMessages((prev) => [...prev, `User ${userId} rolled ${value}`]);
    });

    s.emit("rooms:list");

    return () => s.disconnect();
  }, [token, navigate, joinedRoom?.roomId]);

  // --- Actions ---
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    if (socket) socket.disconnect();
    navigate("/login");
  }, [socket, navigate]);

  const createRoom = useCallback(
    (roomForm) => {
      if (!socket) return;
      socket.emit("session:create", roomForm, (res) => {
        if (res.ok) {
          setJoinedRoom(res.room);
          setJoinedUsers(res.room.players);
        } else {
          console.error("Failed to create room:", res.message);
          setMessages((prev) => [...prev, `Error: Failed to create room: ${res.message}`]);
        }
      });
    },
    [socket]
  );

  const joinRoom = useCallback(
    (roomId) => {
      if (!socket) return;
      socket.emit("session:join", { roomId }, (res) => {
        if (res.ok) {
          setJoinedRoom(res.room);
          setJoinedUsers(res.room.players);
        } else {
          console.error("Failed to join room:", res.message);
          setMessages((prev) => [...prev, `Error: Failed to join room: ${res.message}`]);
        }
      });
    },
    [socket]
  );

  const rollDice = useCallback(() => {
    if (!socket || !joinedRoom) return;
    if (!joinedRoom.gameId) {
      setMessages((prev) => [...prev, "Error: Game has not started yet"]);
      return;
    }
    socket.emit("dice:roll", { roomId: joinedRoom.roomId, gameId: joinedRoom._id }, (res) => {
      if (!res.ok) {
        console.error("Dice roll error:", res.message);
        setMessages((prev) => [...prev, `Error rolling dice: ${res.message}`]);
      }
    });
  }, [socket, joinedRoom]);

  return {
    socket,
    connected,
    joinedRoom,
    availableRooms,
    joinedUsers,
    dice,
    messages,
    logout,
    createRoom,
    joinRoom,
    rollDice,
  };
};
