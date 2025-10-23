// src/pages/Dashboard.jsx
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { SocketContext } from "../context/SocketContext";
import RoomList from "../components/RoomList";
import WalletView from "../components/WalletView";
// import { getRooms } from "../api/rooms";

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    // Fetch available rooms on mount
    const fetchRooms = async () => {
      try {
        const data = await getRooms();
        setRooms(data);
      } catch (err) {
        console.error("Failed to fetch rooms:", err);
      }
    };

    fetchRooms();
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Listen to real-time room updates
    socket.on("room:update", (updatedRoom) => {
      setRooms((prevRooms) =>
        prevRooms.map((r) => (r.roomId === updatedRoom.roomId ? updatedRoom : r))
      );
    });

    socket.on("room:create", (newRoom) => {
      setRooms((prevRooms) => [...prevRooms, newRoom]);
    });

    return () => {
      socket.off("room:update");
      socket.off("room:create");
    };
  }, [socket]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Welcome, {user?.firstName || user?.username}</h1>
      
      <div className="mb-6">
        <WalletView />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Available Rooms</h2>
        <RoomList rooms={rooms} />
      </div>
    </div>
  );
};

export default Dashboard;
