import React from "react";

const ActivityLog = ({ messages, maxEntries = 10 }) => {
  return (
    <div className="bg-white rounded-xl shadow-xl p-5 h-96 overflow-y-auto border border-gray-200">
      <h2 className="text-xl font-bold mb-3 text-blue-600">Activity Log</h2>
      <div className="space-y-1 text-sm">
        {messages.slice(-maxEntries).map((msg, idx) => (
          <p
            key={idx}
            className="text-gray-700 border-b border-gray-100 py-1"
          >
            {msg}
          </p>
        ))}
      </div>
    </div>
  );
};

export default ActivityLog;
