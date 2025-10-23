import React from "react";

const PlayerList = ({ joinedUsers, joinedRoom }) => {
  return (
    <div className="bg-white rounded-xl shadow-xl p-5 border border-gray-200">
      <h2 className="text-xl font-bold mb-3 text-green-600">
        Players in Room: {joinedRoom.roomId}
      </h2>
      <ul className="space-y-2">
        {joinedUsers.map((user, idx) => (
          <li
            key={idx}
            className="p-3 bg-green-50 rounded-lg border border-green-200 shadow-sm text-gray-800 flex justify-between items-center"
          >
            <span className="font-bold">{user.username || user.telegramId}</span>
            {joinedRoom.status === "full" && idx === 0 && (
              <span className="text-sm text-green-700 font-semibold">🎮 Host</span>
            )}
          </li>
        ))}
      </ul>
      {joinedRoom.status === "full" && (
        <p className="mt-3 text-green-700 font-bold p-2 bg-green-100 rounded-lg text-center">
          Game Ready! Waiting for start...
        </p>
      )}
    </div>
  );
};

export default PlayerList;
