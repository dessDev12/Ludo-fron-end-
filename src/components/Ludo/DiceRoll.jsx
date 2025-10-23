import React from "react";

const DiceRoll = ({ dice, rollDice }) => {
  return (
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
  );
};

export default DiceRoll;
