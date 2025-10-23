import React from "react";
import BoardTile from "./BoardTile";
import { BOARD_SIZE, TILE_SIZE } from "../../constants/boardConfig";
import { getTileProps } from "../../utils/getTileProps";

const LudoBoardGrid = () => {
  const cells = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const { color, text, type } = getTileProps(row, col);
      cells.push(<BoardTile key={`${row}-${col}`} row={row} col={col} color={color} type={type} text={text} tileSize={TILE_SIZE} />);
    }
  }

  return (
    <div
      className="mx-auto border-4 border-gray-800 rounded-xl overflow-hidden shadow-inner"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${BOARD_SIZE}, ${TILE_SIZE})`,
        gridTemplateRows: `repeat(${BOARD_SIZE}, ${TILE_SIZE})`,
        width: `calc(${BOARD_SIZE} * ${TILE_SIZE})`,
        height: `calc(${BOARD_SIZE} * ${TILE_SIZE})`,
      }}
    >
      {cells}
    </div>
  );
};

export default LudoBoardGrid;
