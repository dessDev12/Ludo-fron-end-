// src/pages/Admin.jsx
import React, { useEffect, useState } from "react";
import { getUsers } from "../api/admin/users";
import { getRooms } from "../api/rooms";
import { getGames } from "../api/admin/games";
import { getWalletTransactions } from "../api/admin/wallet";

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [games, setGames] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersData = await getUsers();
        setUsers(usersData);

        const roomsData = await getRooms();
        setRooms(roomsData);

        const gamesData = await getGames();
        setGames(gamesData);

        const txData = await getWalletTransactions();
        setTransactions(txData);
      } catch (err) {
        console.error("Admin fetch error:", err);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      {/* Users */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Users</h2>
        <ul className="border rounded p-2">
          {users.map((u) => (
            <li key={u._id}>
              {u.username || u.firstName} - Wallet: {u.wallet?.balance || 0} ETB
            </li>
          ))}
        </ul>
      </section>

      {/* Rooms */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Rooms</h2>
        <ul className="border rounded p-2">
          {rooms.map((r) => (
            <li key={r.roomId}>
              {r.roomId} - Stake: {r.stakeValue} ETB - Status: {r.status} - Players:{" "}
              {r.players?.length || 0}/{r.maxPlayers || 4}
            </li>
          ))}
        </ul>
      </section>

      {/* Games */}
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Games</h2>
        <ul className="border rounded p-2">
          {games.map((g) => (
            <li key={g.gameId}>
              {g.gameId} - Room: {g.roomId} - Status: {g.status} - Winner: {g.winnerUserId || "N/A"}
            </li>
          ))}
        </ul>
      </section>

      {/* Wallet Transactions */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Wallet Transactions</h2>
        <ul className="border rounded p-2">
          {transactions.map((t) => (
            <li key={t._id}>
              {t.type} - User: {t.userId} - Amount: {t.amount} ETB - {new Date(t.createdAt).toLocaleString()}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default Admin;
