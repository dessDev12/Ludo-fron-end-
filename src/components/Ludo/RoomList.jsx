import React from "react";

const RoomList = ({ availableRooms, roomForm, setRoomForm, createRoom, joinRoom }) => {
  return (
    <div className="space-y-6">
      {availableRooms.length > 0 && (
        <div className="bg-white rounded-xl shadow-xl p-5 border border-gray-200">
          <h2 className="text-2xl font-bold mb-4 text-indigo-600">🏠 Join a Room</h2>
          <ul className="space-y-3">
            {availableRooms.map((room) => (
              <li key={room.roomId} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200 rounded-lg hover:shadow-md transition duration-150">
                <span className="font-semibold text-gray-800">{room.roomId} ({room.players.length}/{room.maxPlayers})</span>
                <button onClick={() => joinRoom(room.roomId)} className="bg-green-600 text-white px-4 py-1 rounded-full font-medium hover:bg-green-700 shadow-md">Join</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-xl p-5 border border-gray-200">
        <h2 className="text-2xl font-bold mb-4 text-purple-600">➕ Create Room</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input type="number" placeholder="Stake" value={roomForm.stake} onChange={(e) => setRoomForm({...roomForm, stake: Number(e.target.value)})} className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition" />
          <select value={roomForm.mode} onChange={(e) => setRoomForm({...roomForm, mode: e.target.value})} className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition bg-white">
            <option value="classic">Classic</option>
            <option value="quick">Quick</option>
          </select>
          <input type="number" placeholder="Max Players" value={roomForm.maxPlayers} onChange={(e) => setRoomForm({...roomForm, maxPlayers: Number(e.target.value)})} className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition" />
          <button onClick={createRoom} className="bg-purple-600 text-white px-4 py-3 rounded-lg shadow-md hover:bg-purple-700 col-span-1 md:col-span-2 font-bold transition duration-150">Create Room</button>
        </div>
      </div>
    </div>
  );
};

export default RoomList;
