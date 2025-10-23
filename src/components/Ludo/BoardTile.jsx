import React from "react";

const BoardTile = ({ row, col, color, type, text, tileSize }) => {
  const style = {};

  // Center triangle styling
  if (row >= 6 && row <= 8 && col >= 6 && col <= 8) {
    style.clipPath = "polygon(50% 0%, 100% 100%, 0% 100%)";
    style.backgroundColor = "transparent";
    style.transform = `rotate(${
      row === 6 && col === 7 ? 90 :
      row === 7 && col === 8 ? 180 :
      row === 8 && col === 7 ? 270 : 0
    }deg)`;
  }

  return (
    <div
      className={`
        w-[${tileSize}] h-[${tileSize}] border border-gray-400 flex items-center justify-center
        ${color} ${type === 'base' ? 'text-white text-lg font-extrabold' : 'text-gray-800'}
      `}
      style={style}
    >
      {(type === "base" || type === "startPoint") && <span className="text-xl">{text}</span>}
    </div>
  );
};

export default BoardTile;
