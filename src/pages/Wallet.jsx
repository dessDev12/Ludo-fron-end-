// src/components/WalletView.jsx
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { getWallet } from "../api/wallet";

const WalletView = () => {
  const { user } = useContext(AuthContext);
  const [wallet, setWallet] = useState({ balance: 0, locked: 0, available: 0 });

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const data = await getWallet();
        setWallet(data);
      } catch (err) {
        console.error("Failed to fetch wallet:", err);
      }
    };

    fetchWallet();
  }, []);

  return (
    <div className="border p-4 rounded shadow mb-4">
      <h2 className="text-lg font-semibold mb-2">Wallet</h2>
      <p>
        <strong>Balance:</strong> {wallet.balance.toFixed(2)} ETB
      </p>
      <p>
        <strong>Locked Stake:</strong> {wallet.locked.toFixed(2)} ETB
      </p>
      <p>
        <strong>Available:</strong> {wallet.available.toFixed(2)} ETB
      </p>
    </div>
  );
};

export default WalletView;
