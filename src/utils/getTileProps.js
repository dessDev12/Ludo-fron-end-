// src/utils/getTileProps.js
import { COLORS } from "../constants/boardConfig";

export const getTileProps = (row, col) => {
  // 1. Player Bases (6x6 Corners)
  if (row < 6 && col < 6) return { color: COLORS.RED, type: 'base', text: row === 3 && col === 3 ? 'RED' : '' };
  if (row < 6 && col > 8) return { color: COLORS.GREEN, type: 'base', text: row === 3 && col === 11 ? 'GREEN' : '' };
  if (row > 8 && col < 6) return { color: COLORS.YELLOW, type: 'base', text: row === 11 && col === 3 ? 'YELLOW' : '' };
  if (row > 8 && col > 8) return { color: COLORS.BLUE, type: 'base', text: row === 11 && col === 11 ? 'BLUE' : '' };

  // 2. Center Home Triangle (3x3)
  if (row >= 6 && row <= 8 && col >= 6 && col <= 8) {
    return {
      color: COLORS.HOME_CENTER,
      type: 'center',
      style: {
        clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
        backgroundColor: 'transparent'
      },
      text: row === 7 && col === 7 ? 'HOME' : ''
    };
  }

  // 3. Home Columns/Rows
  const isHomePath =
    (col === 7 && row >= 1 && row <= 5) || // Red
    (row === 7 && col >= 9 && col <= 13) || // Green
    (col === 7 && row >= 9 && row <= 13) || // Yellow
    (row === 7 && col >= 1 && col <= 5); // Blue

  if (isHomePath) {
    let homeColor = '';
    if (row >= 1 && row <= 5 && col === 7) homeColor = 'bg-red-400';
    else if (row === 7 && col >= 9 && col <= 13) homeColor = 'bg-green-400';
    else if (row >= 9 && row <= 13 && col === 7) homeColor = 'bg-yellow-400';
    else if (row === 7 && col >= 1 && col <= 5) homeColor = 'bg-blue-400';

    return { color: homeColor, type: 'homePath' };
  }

  // 4. Start Points
  const isStartPoint = (row === 6 && col === 1) || (row === 1 && col === 8) || (row === 8 && col === 13) || (row === 13 && col === 6);
  if (isStartPoint) {
    let startColor = '';
    if (row === 6 && col === 1) startColor = 'bg-red-300';
    else if (row === 1 && col === 8) startColor = 'bg-green-300';
    else if (row === 8 && col === 13) startColor = 'bg-yellow-300';
    else if (row === 13 && col === 6) startColor = 'bg-blue-300';

    return { color: `${startColor} font-bold text-lg`, type: 'startPoint', text: '★' };
  }

  // 5. Normal Path Tiles
  const isPath = (row >= 6 && row <= 8) || (col >= 6 && col <= 8);
  if (isPath) {
    const isSafeZone = [ [6,5],[8,9],[12,8],[1,6],[5,8],[9,6],[13,8],[8,5],[6,9],[2,6] ]
      .some(([r,c]) => r===row && c===col);

    return { color: isSafeZone ? 'bg-gray-400' : COLORS.PATH, type: isSafeZone ? 'safePath' : 'path' };
  }

  // Default fallback
  return { color: 'bg-black', type: 'error' };
};
