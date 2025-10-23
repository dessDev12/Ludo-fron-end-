import { useContext, useEffect, useState } from "react";
import { SocketContext } from "../context/SocketContext";
import Board from "../components/Board";

export default function GameRoom({ roomId, players }) {
  const { socket } = useContext(SocketContext);
  const [dice, setDice] = useState(null);
  const [turnIndex, setTurnIndex] = useState(0);

  const rollDice = () => {
    socket.emit("dice:roll", { roomId });
  };

  useEffect(() => {
    socket.on("dice:result", (result) => setDice(result));
    socket.on("turn:change", (index) => setTurnIndex(index));
    return () => {
      socket.off("dice:result");
      socket.off("turn:change");
    };
  }, [socket]);

  return (
    <div>
      <h2>Game Room: {roomId}</h2>
      <p>Current Turn: Player {turnIndex + 1}</p>
      <p>Dice: {dice || "-"}</p>
      <button onClick={rollDice}>Roll Dice</button>
      <Board roomId={roomId} players={players} />
    </div>
  );
}
