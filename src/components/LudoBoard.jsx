import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { useLudoSocket } from "../hooks/useLudoSocket";
// ✅ Import board constants
import { BOARD_SIZE, TILE_SIZE, COLORS } from "../constants/boardConfig";
import { getTileProps } from "../utils/getTileProps";

const LudoBoard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // --- Use the custom socket hook ---
  const {
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
  } = useLudoSocket(token, navigate);

  const [roomForm, setRoomForm] = useState({ stake: 10, mode: "classic", maxPlayers: 4 });



  // --- Render Board Cells ---
  const renderBoard = () => {
    const cells = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const { color, text, type } = getTileProps(row, col);

        // This is a simplified Ludo board rendering. For a full Ludo game, 
        // you would need to render the triangle inside the center 3x3 block 
        // and draw home tokens inside the base boxes.
        cells.push(
          <div
            key={`${row}-${col}`}
            className={`
              w-[${TILE_SIZE}] h-[${TILE_SIZE}] border border-gray-400 flex items-center justify-center 
              ${color} text-xs font-semibold
              ${(row < 6 || row > 8) && (col < 6 || col > 8) ? 'border-none' : ''}
              ${type === 'base' ? 'text-white text-lg font-extrabold' : 'text-gray-800'}
            `}
            style={{
              // Special styling for the center triangles
              ...(row >= 6 && row <= 8 && col >= 6 && col <= 8) && {
                clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
                backgroundColor: 'transparent',
                transform: `rotate(${(row === 6 && col === 7) ? 90 :
                  (row === 7 && col === 8) ? 180 :
                    (row === 8 && col === 7) ? 270 :
                      (row === 7 && col === 6) ? 0 :
                        0
                  }deg)`
              }
            }}
          >
            {/* The four main base cells are drawn as large blocks covering the 6x6 area */}
            {type === 'base' && text && <span className="text-xl">{text}</span>}
            {type === 'startPoint' && <span className="text-xl">{text}</span>}
          </div>
        );
      }
    }
    return cells;
  };


  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-6 font-sans">

      {/* Logout Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={logout}
          className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-red-700 transition duration-150 transform hover:scale-[1.02]"
        >
          Logout
        </button>
      </div>

      <div className="flex flex-1 gap-6 flex-wrap lg:flex-nowrap">
        {/* Left: Rooms / Board */}
        <div className="flex-1 min-w-[300px]">
          {!joinedRoom ? (
            <div className="space-y-6">
              {/* Existing Rooms */}
              {availableRooms.length > 0 && (
                <div className="bg-white rounded-xl shadow-xl p-5 border border-gray-200">
                  <h2 className="text-2xl font-bold mb-4 text-indigo-600">🏠 Join a Room</h2>
                  <ul className="space-y-3">
                    {availableRooms.map((room) => (
                      <li
                        key={room.roomId}
                        className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200 rounded-lg hover:shadow-md transition duration-150"
                      >
                        <span className="font-semibold text-gray-800">
                          {room.roomId} ({room.players.length}/{room.maxPlayers})
                        </span>
                        <button
                          onClick={() => joinRoom(room.roomId)}
                          className="bg-green-600 text-white px-4 py-1 rounded-full font-medium hover:bg-green-700 shadow-md"
                        >
                          Join
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Create Room */}
              <div className="bg-white rounded-xl shadow-xl p-5 border border-gray-200">
                <h2 className="text-2xl font-bold mb-4 text-purple-600">➕ Create Room</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Stake"
                    value={roomForm.stake}
                    onChange={(e) =>
                      setRoomForm({ ...roomForm, stake: Number(e.target.value) })
                    }
                    className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  />
                  <select
                    value={roomForm.mode}
                    onChange={(e) =>
                      setRoomForm({ ...roomForm, mode: e.target.value })
                    }
                    className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition bg-white"
                  >
                    <option value="classic">Classic</option>
                    <option value="quick">Quick</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Max Players"
                    value={roomForm.maxPlayers}
                    onChange={(e) =>
                      setRoomForm({
                        ...roomForm,
                        maxPlayers: Number(e.target.value),
                      })
                    }
                    className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  />
                  <button
                    onClick={createRoom}
                    className="bg-purple-600 text-white px-4 py-3 rounded-lg shadow-md hover:bg-purple-700 col-span-1 md:col-span-2 font-bold transition duration-150"
                  >
                    Create Room
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-2xl p-6 border-4 border-gray-300">
              {/* Ludo Board Container with Custom Grid */}
              <h2 className="text-3xl font-bold mb-6 text-green-700 text-center">Ludo Board ({joinedRoom.roomId})</h2>
              <div
                className="mx-auto border-4 border-gray-800 rounded-xl overflow-hidden shadow-inner"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${BOARD_SIZE}, ${TILE_SIZE})`,
                  gridTemplateRows: `repeat(${BOARD_SIZE}, ${TILE_SIZE})`,
                  width: `calc(${BOARD_SIZE} * ${TILE_SIZE})`,
                  height: `calc(${BOARD_SIZE} * ${TILE_SIZE})`,
                  gap: '0px',
                }}
              >
                {renderBoard()}
              </div>


              <div className="flex justify-center items-center gap-4 mt-6 p-4 bg-gray-100 rounded-xl shadow-inner">
                <button
                  onClick={rollDice}
                  className="bg-yellow-500 text-black px-6 py-3 rounded-xl font-extrabold text-lg shadow-lg hover:bg-yellow-600 transition duration-150 transform hover:scale-105"
                >
                  🎲 Roll Dice
                </button>

                {dice !== null && (
                  <div className="text-3xl font-black text-indigo-600 border-2 border-indigo-600 p-3 rounded-xl bg-white shadow-md">
                    {dice}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Players & Messages */}
        <div className="flex flex-col gap-4 w-full lg:w-72 flex-shrink-0">
          {joinedRoom && (
            <div className="bg-white rounded-xl shadow-xl p-5 border border-gray-200">
              <h2 className="text-xl font-bold mb-3 text-green-600">Players in Room: {joinedRoom.roomId}</h2>
              <ul className="space-y-2">
                {joinedUsers.map((user, idx) => (
                  <li key={idx} className="p-3 bg-green-50 rounded-lg border border-green-200 shadow-sm text-gray-800">
                    <span className="font-bold">{user.username || user.telegramId}</span>
                  </li>
                ))}
              </ul>
              {joinedRoom.status === "full" && (
                <p className="mt-3 text-green-700 font-bold p-2 bg-green-100 rounded-lg">
                  Game Ready! Waiting for start...
                </p>
              )}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-xl p-5 h-96 overflow-y-auto border border-gray-200">
            <h2 className="text-xl font-bold mb-3 text-blue-600">Activity Log</h2>
            <div className="space-y-1 text-sm">
              {messages.slice(-10).map((msg, idx) => (
                <p key={idx} className="text-gray-700 border-b border-gray-100 py-1">
                  {msg}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="fixed bottom-6 left-6 bg-white px-5 py-3 rounded-xl shadow-xl border border-gray-300 font-medium">
        <span className="font-bold text-gray-800">Socket Status:</span>{" "}
        {connected === "connecting" && (
          <span className="text-yellow-600 font-semibold">Connecting...</span>
        )}
        {connected === "connected" && (
          <span className="text-green-600 font-semibold">Connected</span>
        )}
        {connected === "not connected" && (
          <span className="text-red-600 font-semibold">Not connected</span>
        )}
      </div>

    </div>
  );
};

export default LudoBoard;

