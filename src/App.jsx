import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';

// NOTE: The server URL is defined here.
const SOCKET_SERVER_URL = "http://localhost:5001"; 
// Initializing socket connection outside of the component for simplicity, 
// and connecting only when the user joins a room.
const socket = io(SOCKET_SERVER_URL, {
    autoConnect: false
});

// --- UI Constants and Helpers ---

/**
 * Maps player colors to Tailwind classes for background, border, and text.
 */
const COLOR_MAP = {
    red: { bg: 'bg-red-600', border: 'border-red-800', hover: 'hover:bg-red-700', text: 'text-red-400', ring: 'ring-red-500', base: 'red' },
    green: { bg: 'bg-green-600', border: 'border-green-800', hover: 'hover:bg-green-700', text: 'text-green-400', ring: 'ring-green-500', base: 'green' },
    blue: { bg: 'bg-blue-600', border: 'border-blue-800', hover: 'hover:bg-blue-700', text: 'text-blue-400', ring: 'ring-blue-500', base: 'blue' },
    yellow: { bg: 'bg-yellow-500', border: 'border-yellow-700', hover: 'hover:bg-yellow-600', text: 'text-yellow-300', ring: 'ring-yellow-400', base: 'yellow' },
};

// Yard Area Coordinates (for mapping token index to grid position when pos=0)
const YARD_AREAS = {
    red: [{r: 12, c: 3}, {r: 12, c: 4}, {r: 13, c: 3}, {r: 13, c: 4}],
    green: [{r: 3, c: 12}, {r: 3, c: 13}, {r: 4, c: 12}, {r: 4, c: 13}],
    yellow: [{r: 3, c: 3}, {r: 3, c: 4}, {r: 4, c: 3}, {r: 4, c: 4}],
    blue: [{r: 12, c: 12}, {r: 12, c: 13}, {r: 13, c: 12}, {r: 13, c: 13}],
};

// Standard Ludo safe squares (star squares + player start squares)
const SAFE_SQUARES = new Set([1, 9, 14, 22, 27, 35, 40, 48]);
// The total number of steps in the path, including the home column, where 58 is the center finish.
const TOTAL_PATH_LENGTH = 58; 

/**
 * Maps the server's path position (1-58) to a 15x15 grid coordinate (row, col).
 * Pos 0 is the home/yard. Pos 58 is the center finish.
 * @param {string} color - Player color ('red', 'green', 'blue', 'yellow') 
 * @param {number} pos - Server position (1-58, where 58 is the center finish)
 * @returns {object} {r: number, c: number} (1-indexed row and column)
 */
const mapPathToGrid = (color, pos) => {
    // 58 is the center finish point (r=8, c=8) - The "Final Win Place"
    if (pos === TOTAL_PATH_LENGTH) return { r: 8, c: 8 };

    // --- Home Column (53-57) ---
    // These squares lead from the main path into the center (5 steps).
    if (pos >= 53 && pos < TOTAL_PATH_LENGTH) {
        const homeOffset = pos - 52; // 1 (entry) to 5 (near center)
        switch (color) {
            // Red Home Path (Left of 8,8) - R=8, C=7 to C=3
            case 'red':    return { r: 8, c: 7 - (homeOffset - 1) }; // e.g. 53 (offset 1) -> C=7
            // Green Home Path (Above 8,8) - R=7 to R=3, C=8
            case 'green':  return { r: 7 - (homeOffset - 1), c: 8 }; // e.g. 53 (offset 1) -> R=7
            // Yellow Home Path (Right of 8,8) - R=8, C=9 to C=13 
            case 'yellow': return { r: 8, c: 9 + (homeOffset - 1) }; // e.g. 53 (offset 1) -> C=9
            // Blue Home Path (Below 8,8) - R=9 to R=13, C=8 
            case 'blue':   return { r: 9 + (homeOffset - 1), c: 8 }; // e.g. 53 (offset 1) -> R=9
            default: return { r: 0, c: 0 };
        }
    }

    // --- Main Path (1-52) ---
    const PATH_COORDS = {
        // Red's Path (Upwards: 1-6)
        1: { r: 14, c: 7 }, 2: { r: 13, c: 7 }, 3: { r: 12, c: 7 }, 4: { r: 11, c: 7 }, 5: { r: 10, c: 7 }, 6: { r: 9, c: 7 },
        // Corner 1 (Right & Up: 7-13)
        7: { r: 9, c: 8 }, 8: { r: 9, c: 9 }, 9: { r: 9, c: 10 }, 10: { r: 9, c: 11 }, 11: { r: 9, c: 12 }, 12: { r: 9, c: 13 },
        13: { r: 8, c: 13 },
        // Green's Path (Leftwards: 14-19)
        14: { r: 7, c: 13 }, 15: { r: 7, c: 12 }, 16: { r: 7, c: 11 }, 17: { r: 7, c: 10 }, 18: { r: 7, c: 9 }, 19: { r: 7, c: 8 },
        // Corner 2 (Up & Left: 20-26)
        20: { r: 6, c: 8 }, 21: { r: 5, c: 8 }, 22: { r: 4, c: 8 }, 23: { r: 3, c: 8 }, 24: { r: 2, c: 8 }, 25: { r: 1, c: 8 },
        26: { r: 1, c: 7 },
        // Yellow's Path (Downwards: 27-32)
        27: { r: 2, c: 7 }, 28: { r: 3, c: 7 }, 29: { r: 4, c: 7 }, 30: { r: 5, c: 7 }, 31: { r: 6, c: 7 }, 32: { r: 7, c: 7 },
        // Corner 3 (Left & Down: 33-39)
        33: { r: 7, c: 6 }, 34: { r: 7, c: 5 }, 35: { r: 7, c: 4 }, 36: { r: 7, c: 3 }, 37: { r: 7, c: 2 }, 38: { r: 7, c: 1 },
        39: { r: 8, c: 1 },
        // Blue's Path (Rightwards: 40-45)
        40: { r: 9, c: 2 }, 41: { r: 9, c: 3 }, 42: { r: 9, c: 4 }, 43: { r: 9, c: 5 }, 44: { r: 9, c: 6 }, 45: { r: 9, c: 7 },
        // Corner 4 (Down & Right: 46-52)
        46: { r: 10, c: 8 }, 47: { r: 11, c: 8 }, 48: { r: 12, c: 8 }, 49: { r: 13, c: 8 }, 50: { r: 14, c: 8 }, 51: { r: 15, c: 8 },
        52: { r: 15, c: 9 },
    };

    return PATH_COORDS[pos] || { r: 0, c: 0 };
};

/**
 * A square on the board, potentially containing tokens.
 */
const BoardSquare = ({ pos, tokens, onTokenClick, isYard, homeColorKey, isStart, isSafe }) => {
    
    const isCenterFinish = pos.r === 8 && pos.c === 8; // The final win place

    // Determine the base style of the square
    let squareBg = 'bg-gray-700/50'; // Default path square
    let squareBorder = 'border-gray-600';
    let safeMarker = null;

    if (isYard) {
        // Yard squares are a darker version of the color
        squareBg = COLOR_MAP[homeColorKey]?.bg.replace('-600', '-800').replace('-500', '-800');
        squareBorder = 'border-gray-600';
    } else if (isCenterFinish) {
        // Aesthetic update for the final win place
        squareBg = 'bg-gray-950/70 border-4 border-dashed border-teal-400'; 
        squareBorder = 'border-none';
        safeMarker = <span className="absolute text-teal-300 text-3xl font-black pointer-events-none tracking-widest animate-pulse">WIN</span>;
    } else if (homeColorKey && (pos.r === 8 || pos.c === 8)) {
        // Home column colors (leading into the center, visually distinct)
        // Check if it is one of the 5 home column squares (excluding the center 8,8)
        if (
            (homeColorKey === 'red' && pos.r === 8 && pos.c >= 3 && pos.c <= 7) ||
            (homeColorKey === 'green' && pos.c === 8 && pos.r >= 3 && pos.r <= 7) ||
            (homeColorKey === 'yellow' && pos.r === 8 && pos.c >= 9 && pos.c <= 13) ||
            (homeColorKey === 'blue' && pos.c === 8 && pos.r >= 9 && pos.r <= 13)
        ) {
            squareBg = COLOR_MAP[homeColorKey]?.bg.replace('-600', '-900').replace('-500', '-900') + ' border-dashed';
            squareBorder = 'border-gray-600';
        }
    } else if (isStart) {
        // The starting square gets the main color
        squareBg = COLOR_MAP[homeColorKey]?.bg.replace('bg-yellow-500', 'bg-yellow-600');
        squareBorder = COLOR_MAP[homeColorKey]?.border;
    } else if (isSafe) {
        // Safe square (star)
        squareBg = 'bg-gray-600';
        safeMarker = <span className="absolute text-yellow-300 text-2xl pointer-events-none">★</span>;
    } 

    return (
        <div
            className={`
                aspect-square w-full h-full border border-collapse flex items-center justify-center relative
                ${squareBg} ${squareBorder}
            `}
            style={{
                gridRow: pos?.r,
                gridColumn: pos?.c,
            }}
        >
            {/* Tokens placed on this square (including finished tokens in the center) */}
            <div className={`flex flex-wrap items-center justify-center gap-1 p-0.5 ${tokens.length > 2 ? 'scale-75' : 'scale-90'}`}>
                {tokens.map(({ tokenColor, tokenIndex, isMovable }, index) => (
                    <Token
                        key={index}
                        color={tokenColor}
                        tokenIndex={tokenIndex}
                        onClick={onTokenClick}
                        isMovable={isMovable}
                        // Smaller tokens for the center finish to fit up to 4
                        isFinished={isCenterFinish} 
                    />
                ))}
            </div>
            
            {safeMarker}
        </div>
    );
};


/**
 * A simple visual representation of a Ludo token.
 */
const Token = ({ color, tokenIndex, onClick, isMovable, isFinished }) => {
    const colorClasses = COLOR_MAP[color] || COLOR_MAP.red;
    
    // Adjusted size for center finish
    const size = isFinished ? 'w-5 h-5' : 'w-6 h-6';
    
    // Adjusted styling for the token
    const className = `
        ${size} rounded-full shadow-lg transition-all duration-150 transform 
        ${colorClasses.bg} border-2 ${colorClasses.border}
        flex items-center justify-center font-bold text-white
        ${isMovable 
            ? `cursor-pointer ${colorClasses.hover} ring-offset-1 ring-opacity-100 ring-2 ${colorClasses.ring.replace('ring-', 'ring-offset-gray-900 ring-')} hover:scale-110` 
            : 'cursor-default opacity-80'
        }`;
    
    return (
        <div 
            className={className}
            onClick={isMovable ? () => onClick(tokenIndex) : null}
            title={isMovable ? `Move Token ${tokenIndex + 1}` : `Token ${tokenIndex + 1}`}
        >
            <span className="text-xs">
                {/* Show token index only if not finished, or if finished and is the first */}
                {!isFinished && tokenIndex + 1}
                {isFinished && '✓'}
            </span>
        </div>
    );
};

/**
 * Renders the token currently being animated, absolute positioned over the grid.
 */
const MovingToken = ({ animation }) => {
    const { tokenColor, tokenIndex, currentGridPos } = animation;
    const colorClasses = COLOR_MAP[tokenColor] || COLOR_MAP.red;
    
    const cellSize = 100 / 15; // Percentage of the grid width/height
    
    // Position center of the token to the center of the target grid cell
    const leftPercent = (currentGridPos.c - 1) * cellSize + (cellSize / 2);
    const topPercent = (currentGridPos.r - 1) * cellSize + (cellSize / 2);

    return (
        <div 
            className={`
                absolute w-6 h-6 rounded-full shadow-lg z-50
                ${colorClasses.bg} border-2 ${colorClasses.border}
                flex items-center justify-center font-bold text-white
                transition-all duration-[150ms] ease-linear 
            `}
            style={{
                // Position center of the token to the center of the target grid cell
                left: `${leftPercent}%`,
                top: `${topPercent}%`,
                transform: 'translate(-50%, -50%)', // Center the token element
            }}
        >
            <span className="text-xs">
                {tokenIndex + 1}
            </span>
        </div>
    );
};


// --- Ludo Grid Component ---

const LudoGrid = ({ gameState, onTokenClick, isCurrentPlayer, myPlayer, animation }) => {

    const currentDice = gameState.diceValue;
    const isWaitingForMove = gameState.status === 'waiting_for_move';
    const currentPlayerId = myPlayer?.id;
    
    // Grid positions for the Yard areas (4 squares per yard)
    const yardAreas = YARD_AREAS;
    
    // Player configuration based on start path position
    const PLAYER_CONFIG = useMemo(() => ({
        red: { startPos: 1 },
        green: { startPos: 14 },
        yellow: { startPos: 27 },
        blue: { startPos: 40 },
    }), []);

    // Helper to check if a token is currently animating
    const isTokenAnimating = (tokenColor, tokenIndex) => {
        return animation?.isRunning && 
               animation.tokenColor === tokenColor && 
               animation.tokenIndex === tokenIndex;
    };

    // --- Core Movement Logic (Client-Side Check for Visuals) ---
    const isMoveLegal = useCallback((tokenPos, roll) => {
        // Rule 4.A: Token in Home
        if (tokenPos === 0) {
            return roll === 6;
        }
        
        // Rule 5: Finishing (must match dice exactly)
        const newPosition = tokenPos + roll;
        if (newPosition > TOTAL_PATH_LENGTH) {
            return false; // Overshot the finish square (58)
        }
        
        // Any move that doesn't overshoot is legal (the server will handle kills/safety).
        if (tokenPos > 0 && tokenPos < TOTAL_PATH_LENGTH) {
            return true;
        }

        return false;
    }, []);


    // --- 1. Populate the Board State ---
    const boardState = useMemo(() => {
        const squares = {};

        // YARDS (Position 0)
        gameState.players.forEach(player => {
            const colorKey = player.color;
            // Get all tokens that are currently in the yard (pos = 0)
            const yardTokens = player.tokens.map((pos, index) => ({ pos, index })).filter(t => t.pos === 0);
            
            // Distribute yard tokens across the 4 yard squares
            yardTokens.forEach((token, idx) => {
                const { r, c } = yardAreas[colorKey][idx] || yardAreas[colorKey][0]; 
                const key = `${r}-${c}`;
                
                // Exclude the animating token from its starting yard spot
                if (isTokenAnimating(colorKey, token.index)) {
                    return;
                }
                
                squares[key] = squares[key] || { r, c, pos: 0, tokens: [], homeColorKey: colorKey, isYard: true };
                
                // Check movability based on the new, strict rule set
                squares[key].tokens.push({
                    tokenColor: colorKey,
                    tokenIndex: token.index,
                    isMovable: isCurrentPlayer && isWaitingForMove && (player.id === currentPlayerId) && isMoveLegal(token.pos, currentDice)
                });
            });
        });

        // PATH & HOME COLUMN TOKENS (Position 1-58)
        gameState.players.forEach(player => {
            const colorKey = player.color;
            player.tokens.forEach((pos, tokenIndex) => {
                // Tokens that are on the board, but not finished (pos <= 58)
                if (pos > 0) {

                    // Exclude the animating token from its starting path square
                    if (isTokenAnimating(colorKey, tokenIndex)) {
                        return;
                    }

                    const { r, c } = mapPathToGrid(colorKey, pos);
                    const key = `${r}-${c}`;
                    
                    // Check if this is a starting square for ANY player
                    const isStartSquare = Object.values(PLAYER_CONFIG).some(conf => conf.startPos === pos);
                    // Pos 58 (Center) is always safe
                    const isSafeSquare = SAFE_SQUARES.has(pos) || pos === TOTAL_PATH_LENGTH;

                    squares[key] = squares[key] || { 
                        r, c, pos, 
                        tokens: [], 
                        homeColorKey: colorKey, // The primary color associated with this section of the board
                        isStart: isStartSquare,
                        isSafe: isSafeSquare,
                    };
                    
                    // Check movability based on the new, strict rule set
                    squares[key].tokens.push({
                        tokenColor: colorKey,
                        tokenIndex,
                        isMovable: isCurrentPlayer && isWaitingForMove && player.id === currentPlayerId && isMoveLegal(pos, currentDice)
                    });
                }
            });
        });

        return squares;
    }, [gameState, isCurrentPlayer, isWaitingForMove, currentDice, currentPlayerId, yardAreas, PLAYER_CONFIG, isMoveLegal, animation]);


    // --- 2. Generate Grid Cells (15x15) ---
    const gridCells = [];
    for (let r = 1; r <= 15; r++) {
        for (let c = 1; c <= 15; c++) {
            const key = `${r}-${c}`;
            let squareData = boardState[key];
            
            // Special handling for the center 8,8 to ensure it always renders as a target
            if (r === 8 && c === 8) {
                // Ensure there is always a squareData object for 8,8 even if empty
                squareData = squareData || { r, c, pos: TOTAL_PATH_LENGTH, tokens: [], homeColorKey: null, isSafe: true };
            }


            // Determine background color for static areas
            let cellBg = 'bg-gray-700/50';
            let homeColorKey = null;

            // 6x6 Yard Areas (Standard Ludo Layout)
            if (r <= 6 && c <= 6) { // Yellow (Top-Left)
                cellBg = COLOR_MAP.yellow.bg.replace('-500', '-800'); homeColorKey = 'yellow'; 
            } else if (r <= 6 && c >= 10) { // Green (Top-Right)
                cellBg = COLOR_MAP.green.bg.replace('-600', '-800'); homeColorKey = 'green'; 
            } else if (r >= 10 && c <= 6) { // Red (Bottom-Left)
                cellBg = COLOR_MAP.red.bg.replace('-600', '-800'); homeColorKey = 'red'; 
            } else if (r >= 10 && c >= 10) { // Blue (Bottom-Right)
                cellBg = COLOR_MAP.blue.bg.replace('-600', '-800'); homeColorKey = 'blue'; 
            }
            
            // Determine if the cell is part of a Home Column path background
            let isHomeColBg = false;
            let pathColor = null;

            if (r === 8 && c >= 3 && c <= 7) { pathColor = 'red'; } // Red Home Path
            else if (r >= 3 && r <= 7 && c === 8) { pathColor = 'green'; } // Green Home Path
            else if (r === 8 && c >= 9 && c <= 13) { pathColor = 'yellow'; } // Yellow Home Path
            else if (r >= 9 && r <= 13 && c === 8) { pathColor = 'blue'; } // Blue Home Path
            
            if (pathColor) {
                cellBg = COLOR_MAP[pathColor].bg.replace('-600', '-900').replace('-500', '-900');
                homeColorKey = pathColor;
                isHomeColBg = true;
            }

            // Static Start Squares (P1, P14, P27, P40) - Overrides home column color for the single start square
            if (r === 14 && c === 7) { cellBg = COLOR_MAP.red.bg; homeColorKey = 'red'; isHomeColBg = false; }
            else if (r === 7 && c === 13) { cellBg = COLOR_MAP.green.bg; homeColorKey = 'green'; isHomeColBg = false; }
            else if (r === 2 && c === 7) { cellBg = COLOR_MAP.yellow.bg.replace('-500', '-600'); homeColorKey = 'yellow'; isHomeColBg = false; }
            else if (r === 9 && c === 2) { cellBg = COLOR_MAP.blue.bg; homeColorKey = 'blue'; isHomeColBg = false; }


            // Render the square component if it contains tokens OR is a yard square OR is the center
            if (squareData) {
                 gridCells.push(
                    <BoardSquare 
                        key={key} 
                        pos={{ r, c }}
                        tokens={squareData.tokens}
                        onTokenClick={onTokenClick}
                        isStart={squareData.isStart}
                        isSafe={squareData.isSafe}
                        isYard={squareData.isYard}
                        homeColorKey={squareData.homeColorKey || homeColorKey}
                    />
                );
            } else {
                // Render placeholder for static background cells
                let baseColorClass = cellBg;
                 gridCells.push(
                    <div 
                        key={key} 
                        className={`
                            aspect-square w-full h-full border border-collapse border-gray-600
                            ${baseColorClass}
                            ${isHomeColBg ? 'border-dashed' : ''}
                            flex items-center justify-center
                        `}
                        style={{ 
                            gridRow: r, 
                            gridColumn: c,
                        }}
                    >
                         {/* Static marker for safe squares on empty path squares (optional) */}
                         {(SAFE_SQUARES.has(r === 9 && c === 10) || SAFE_SQUARES.has(r === 4 && c === 8) || SAFE_SQUARES.has(r === 7 && c === 4) || SAFE_SQUARES.has(r === 12 && c === 8)) && (
                            <span className="text-yellow-300 text-xl opacity-60 pointer-events-none">★</span>
                        )}
                    </div>
                );
            }
        }
    }
    
    return (
        <div 
            className="grid mx-auto max-w-[80vmin] bg-gray-900 border-4 border-gray-700 shadow-2xl relative"
            style={{
                gridTemplateRows: 'repeat(15, minmax(0, 1fr))',
                gridTemplateColumns: 'repeat(15, minmax(0, 1fr))',
                gap: '0px',
            }}
        >
            {gridCells}

            {/* Center Finish Home Area with Colored Triangles (7/8/9 rows/cols) */}
            <div 
                className="absolute pointer-events-none"
                style={{ 
                    // This div covers the entire 3x3 center area visually (R7-9, C7-9)
                    gridRow: '7 / span 3', 
                    gridColumn: '7 / span 3', 
                    zIndex: 10
                }}
            >
                {/* Visual Diamond Overlay in 3x3 area (Aligned with standard colors) */}
                
                {/* Red Triangle (Bottom strip, Left half: R=9, C=7-9) */}
                <div className={`absolute w-full h-1/3 ${COLOR_MAP.red.bg.replace('-600', '-700')}`} style={{ left: '0%', top: '66.66%', clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}></div>
                
                {/* Green Triangle (Top strip, Right half: R=7, C=7-9) */}
                <div className={`absolute w-full h-1/3 ${COLOR_MAP.green.bg.replace('-600', '-700')}`} style={{ left: '0%', top: '0%', clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)' }}></div>
                
                {/* Yellow Triangle (Left strip, Top half: C=7, R=7-9) */}
                <div className={`absolute w-1/3 h-full ${COLOR_MAP.yellow.bg.replace('-500', '-600')}`} style={{ left: '0%', top: '0%', clipPath: 'polygon(100% 50%, 0% 100%, 0% 0%)' }}></div>
                
                {/* Blue Triangle (Right strip, Bottom half: C=9, R=7-9) */}
                <div className={`absolute w-1/3 h-full ${COLOR_MAP.blue.bg.replace('-600', '-700')}`} style={{ left: '66.66%', top: '0%', clipPath: 'polygon(0% 50%, 100% 0%, 100% 100%)' }}></div>


                {/* Center Square (8, 8) background to cover intersection - handled by BoardSquare for pos 58 */}
                <div className="absolute w-1/3 h-1/3 bg-gray-900/50" style={{ left: '33.33%', top: '33.33%' }}></div>
            </div>
            
            {/* RENDER THE ANIMATING TOKEN OVER ALL */}
            {animation?.isRunning && <MovingToken animation={animation} />}
        </div>
    );
};


// --- Main Application Component ---

const App = () => {
    const [roomCode, setRoomCode] = useState('');
    const [gameState, setGameState] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const [diceDisplay, setDiceDisplay] = useState(null);
    const [numPlayers, setNumPlayers] = useState(0);

    // --- Animation State and Helpers ---
    const ANIMATION_SPEED = 150; // ms per step
    // { tokenColor: string, tokenIndex: number, path: [{r, c}], currentStep: number, isRunning: boolean, currentGridPos: {r, c} }
    const [animation, setAnimation] = useState(null); 
    // Flag to block immediate gameState update from the server
    const [isAwaitingMoveConfirm, setIsAwaitingMoveConfirm] = useState(false); 
    // Stores the server's final state until animation is done
    const [pendingUpdate, setPendingUpdate] = useState(null); 

    // Helper functions for path calculation
    const getPlayerPathIndex = useCallback((color, currentPos) => {
        const START_INDEX = { red: 1, green: 14, yellow: 27, blue: 40 }[color];
        const MAX_MAIN_PATH = 52;
        
        if (currentPos === 0) return 0; // Yard
        if (currentPos > MAX_MAIN_PATH) return currentPos; // Home Column/Finish (53-58)
        
        // Main Path (1-52)
        let relativeIndex = currentPos - START_INDEX;
        if (relativeIndex < 0) {
            // Token has wrapped around (e.g., Green pos 13)
            relativeIndex += MAX_MAIN_PATH;
        }
        
        // Player's path index (1 to 52)
        return relativeIndex + 1;
    }, []);

    const getServerBoardIndex = useCallback((color, playerPathIndex) => {
        const START_INDEX = { red: 1, green: 14, yellow: 27, blue: 40 }[color];
        const MAX_MAIN_PATH = 52;

        if (playerPathIndex > MAX_MAIN_PATH) return playerPathIndex; // Home column (53-58)

        let serverIndex = START_INDEX + playerPathIndex - 1;
        if (serverIndex > MAX_MAIN_PATH) {
            serverIndex -= MAX_MAIN_PATH;
        }
        return serverIndex;
    }, []);

    // This function calculates the sequence of grid coordinates {r, c} for the animation.
    const generateGridPath = useCallback((color, startPos, diceRoll) => {
        const pathIndices = [];

        let pStart = getPlayerPathIndex(color, startPos); 
        let pEnd = pStart + diceRoll;
        
        // Special case for leaving the yard (pos 0). 
        // We assume server moves the token to path index 1 (the start square) 
        // and then applies the remaining 5 steps. The animation should cover all 6 steps.
        if (startPos === 0 && diceRoll === 6) {
            pStart = 0;
            pEnd = 6; // Animate 6 steps from the start of the path
        }

        for (let i = pStart + 1; i <= pEnd; i++) {
            if (i > TOTAL_PATH_LENGTH) break;
            
            let serverIndex;
            if (i > 52) {
                // Home Column/Finish (53-58)
                serverIndex = i;
            } else {
                // Main Path (1-52)
                serverIndex = getServerBoardIndex(color, i);
            }
            pathIndices.push(serverIndex);
        }
        
        // Map path indices to grid coordinates
        return pathIndices.map(pos => mapPathToGrid(color, pos));
    }, [getPlayerPathIndex, getServerBoardIndex]);


    const currentPlayer = gameState?.players?.[gameState.currentPlayerIndex];
    const isCurrentPlayer = currentPlayer?.id === socket.id;
    const myPlayer = gameState?.players.find(p => p.id === socket.id);

    // Dynamic border highlight for the current player's turn
    const borderClass = useMemo(() => {
        if (myPlayer) {
            // Use a stronger ring for the whole panel
            return COLOR_MAP[myPlayer.color]?.ring.replace('ring-', 'ring-4 ring-offset-2 ring-') || 'ring-gray-800';
        }
        return 'ring-gray-800';
    }, [myPlayer]);

    // --- Socket Event Listeners ---
    useEffect(() => {
        const handleGameStateUpdate = (state) => {
            if (isAwaitingMoveConfirm) {
                // Block immediate update, store the final state
                setPendingUpdate(state);
            } else {
                // Safe to update immediately (e.g., another player moved, or post-animation cleanup)
                if (state.status === 'waiting_for_roll' && gameState?.status !== 'waiting_for_roll') {
                    setDiceDisplay(null); // Clear dice display for the new player's turn
                }
                setGameState(state);
            }
            console.log("State Updated:", state.message);
        };
        
        socket.on('connect', () => {
            setIsConnected(true);
            setError(null);
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
            setGameState(null);
            setDiceDisplay(null);
        });

        socket.on('gameStarted', (state) => {
            setGameState(state);
            setError(null);
            setDiceDisplay(null);
            console.log("Game started:", state);
        });

        socket.on('gameStateUpdate', handleGameStateUpdate);

        socket.on('playerJoined', (count) => {
            setNumPlayers(count);
            if (!gameState) {
                setError(`Waiting for 2+ players. Current: ${count}`);
            }
        });

        socket.on('diceRolled', ({ roll, state }) => {
            setDiceDisplay(roll);
            setGameState(state);
            setError(null); // Clear any old error on a successful roll
        });

        socket.on('gameError', (msg) => {
            setError(msg);
            console.error("Game Error:", msg);
        });

        socket.on('gameOver', (state) => {
            setGameState(state);
            setError(null);
            console.log("Game Over:", state.message);
        });

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('gameStarted');
            socket.off('gameStateUpdate', handleGameStateUpdate);
            socket.off('playerJoined');
            socket.off('diceRolled');
            socket.off('gameError');
            socket.off('gameOver');
        };
    }, [gameState, isAwaitingMoveConfirm]); // Re-run effect when this block flag changes

    // --- Animation Sequence Effect ---
    useEffect(() => {
        if (animation?.isRunning) {
            const timer = setTimeout(() => {
                const nextStep = animation.currentStep + 1;
                
                if (nextStep < animation.path.length) {
                    // Continue animation
                    setAnimation(prev => ({
                        ...prev,
                        currentStep: nextStep,
                        currentGridPos: prev.path[nextStep],
                    }));
                } else {
                    // Animation finished
                    setAnimation(prev => ({ ...prev, isRunning: false }));
                    // The pendingUpdate useEffect will pick this up and apply the final state
                }
            }, ANIMATION_SPEED);
            
            return () => clearTimeout(timer);
        }
    }, [animation]);

    // --- Pending Update Effect (Applies final state after animation) ---
    useEffect(() => {
        if (pendingUpdate && !animation?.isRunning) {
            // Animation is finished, apply the pending server state
            setGameState(pendingUpdate);
            setPendingUpdate(null);
            setIsAwaitingMoveConfirm(false); // Clear the block flag
        }
    }, [pendingUpdate, animation?.isRunning]);


    // --- User Actions ---

    const handleJoinGame = useCallback(() => {
        if (!roomCode.trim()) {
            setError('Please enter a room code.');
            return;
        }
        setError(null); // Clear error on attempt to join
        
        if (socket.connected) {
            socket.emit('joinGame', roomCode.trim());
        } else {
            // Attempt to connect and join if not connected
            socket.connect();
            socket.once('connect', () => {
                socket.emit('joinGame', roomCode.trim());
            });
            socket.once('connect_error', (err) => {
                setError(`Connection failed: ${err.message}`);
            });
        }
    }, [roomCode]);

    const handleRollDice = useCallback(() => {
        if (!gameState || !isCurrentPlayer || gameState.status !== 'waiting_for_roll') {
            setError("It's not your turn or not the right phase to roll.");
            return;
        }
        // IMPORTANT: Clear error before sending action
        setError(null);
        socket.emit('rollDice', roomCode);
    }, [gameState, isCurrentPlayer, roomCode]);

    const handleTokenClick = useCallback((tokenIndex) => {
        if (!gameState || !isCurrentPlayer || gameState.status !== 'waiting_for_move' || isAwaitingMoveConfirm) {
            setError("It's not your turn, you need to roll first, or a move is already animating.");
            return;
        }
        
        const tokenPlayer = gameState.players.find(p => p.id === socket.id);
        const startPos = tokenPlayer.tokens[tokenIndex];
        const color = tokenPlayer.color;
        const diceRoll = gameState.diceValue;

        // 1. Calculate the animation path
        const path = generateGridPath(color, startPos, diceRoll);

        if (path.length > 0) {
            // Determine the starting grid coordinate
            let startGridPos;
            if (startPos === 0) {
                // Token is in the yard. Use the hardcoded yard position for this token index
                startGridPos = YARD_AREAS[color][tokenIndex] || YARD_AREAS[color][0];
            } else {
                // Token is on the path.
                startGridPos = mapPathToGrid(color, startPos);
            }

            setAnimation({
                tokenColor: color,
                tokenIndex: tokenIndex,
                path: path,
                currentStep: 0,
                isRunning: true,
                currentGridPos: startGridPos, 
            });
            
            // Set flag to block immediate gameState update
            setIsAwaitingMoveConfirm(true); 
        } else {
            setError("Illegal move detected by client-side rule check. Server will validate.");
        }

        // 2. Send the move to the server (even if path.length is 0, let server decide if it's illegal)
        socket.emit('moveToken', { roomCode, tokenIndex });

    }, [gameState, isCurrentPlayer, roomCode, generateGridPath, isAwaitingMoveConfirm]);

    // --- Render Logic ---

    // 1. Connection/Join Screen
    if (!gameState) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 font-inter">
                <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md text-white border-t-4 border-teal-500">
                    <h1 className="text-4xl font-extrabold mb-6 text-center text-teal-400">
                        <span role="img" aria-label="dice">🎲</span> Ludo Online
                    </h1>
                    <p className="text-center text-sm mb-4 text-gray-400">
                        Status: {isConnected ? 'Connected' : 'Disconnected'} | Your ID: <span className='font-mono text-xs'>{socket.id || 'N/A'}</span>
                    </p>
                    
                    <input
                        type="text"
                        placeholder="Enter Room Code (e.g., LUDO123)"
                        value={roomCode}
                        onChange={(e) => {
                            setRoomCode(e.target.value.toUpperCase());
                            setError(null);
                        }}
                        className="w-full p-3 mb-4 rounded-lg bg-gray-700 border border-gray-600 text-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                    />
                    
                    <button
                        onClick={handleJoinGame}
                        disabled={!roomCode.trim()}
                        className="w-full py-3 bg-teal-600 rounded-lg font-bold text-lg shadow-teal-500/50 hover:bg-teal-700 transition duration-200 disabled:opacity-50"
                    >
                        Join or Create Game
                    </button>
                    
                    {error && (
                        <div className="mt-4 p-3 bg-red-800 text-white rounded-lg text-center font-medium">
                            {error}
                        </div>
                    )}
                    
                    <p className="mt-6 text-center text-xs text-gray-500">
                        Enter any unique code to start a game. Players need 2+ to start.
                    </p>
                    <p className="mt-1 text-center text-xs text-gray-500">
                        Current players joined: {numPlayers}
                    </p>
                </div>
            </div>
        );
    }
    
    // 2. Game Board Screen
    const playerColor = myPlayer?.color || 'gray';
    const playerColorClass = COLOR_MAP[playerColor] || { bg: 'bg-gray-800', text: 'text-gray-400' };
    const currentPlayerColorClass = currentPlayer?.color ? COLOR_MAP[currentPlayer.color] : { bg: 'bg-gray-800', text: 'text-white' };
    
    return (
        <div className="min-h-screen bg-gray-900 flex flex-col lg:flex-row items-center justify-center p-4 font-inter text-white">
            <div className={`p-4 rounded-xl shadow-2xl transition duration-500 ring-4 ${borderClass.replace('ring-', 'ring-offset-gray-900 ring-')}`}>
                <LudoGrid 
                    gameState={gameState} 
                    onTokenClick={handleTokenClick} 
                    isCurrentPlayer={isCurrentPlayer} 
                    myPlayer={myPlayer}
                    animation={animation} // Pass animation state
                />
            </div>

            {/* Game Info Panel */}
            <div className="w-full max-w-sm lg:max-w-xs p-6 bg-gray-800 rounded-xl shadow-lg mt-6 lg:ml-6 lg:mt-0 border-t-4 border-gray-700 flex flex-col space-y-4">
                <h2 className="text-2xl font-bold text-teal-400 text-center">Ludo Game ({roomCode})</h2>
                
                {/* Status Card */}
                <div className={`p-4 rounded-lg shadow-md ${currentPlayerColorClass.bg.replace('-600', '-700').replace('-500', '-700')} text-white`}>
                    <p className="text-sm font-semibold">Current Turn:</p>
                    <p className="text-xl font-extrabold capitalize">{currentPlayer?.color} {currentPlayer?.id === socket.id ? '(Your Turn)' : ''}</p>
                    <p className="text-sm mt-1">{gameState.status.replace(/_/g, ' ')}</p>
                </div>

                {/* Dice Roller */}
                <div className="flex flex-col items-center">
                    {diceDisplay !== null && (
                         <div className={`text-6xl font-extrabold p-4 w-20 h-20 flex items-center justify-center rounded-xl shadow-xl mb-4 ${currentPlayerColorClass.bg}`}>
                            {diceDisplay}
                        </div>
                    )}
                   
                    <button
                        onClick={handleRollDice}
                        disabled={!isCurrentPlayer || gameState.status !== 'waiting_for_roll' || isAwaitingMoveConfirm}
                        className={`w-full py-3 text-lg font-bold rounded-lg shadow-xl transition disabled:opacity-50 
                            ${playerColorClass.bg} ${playerColorClass.hover} 
                            ${!isCurrentPlayer || gameState.status !== 'waiting_for_roll' || isAwaitingMoveConfirm ? 'bg-gray-600 cursor-not-allowed' : ''}
                        `}
                    >
                        {gameState.status === 'game_over' ? 'Game Over' : 'Roll Dice'}
                    </button>
                    <p className="text-xs text-gray-400 mt-2">
                        {isCurrentPlayer && gameState.status === 'waiting_for_move' 
                            ? `Select a highlighted token to move. Animating: ${isAwaitingMoveConfirm}` 
                            : "Roll to start your turn."
                        }
                    </p>
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-800 text-white rounded-lg text-center font-medium">
                        {error}
                    </div>
                )}

                {/* Player List */}
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold border-b border-gray-700 pb-1">Players</h3>
                    {gameState.players.map((player) => (
                        <div key={player.id} className={`flex items-center justify-between p-2 rounded-lg ${player.id === currentPlayer?.id ? 'bg-gray-700 border border-teal-500' : 'bg-gray-800'}`}>
                            <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${COLOR_MAP[player.color].bg} ${player.id === socket.id ? 'ring-2 ring-teal-300' : ''}`}></div>
                                <span className="capitalize">{player.color}</span>
                            </div>
                            <span className="text-sm text-gray-400 font-mono">ID: {player.id.substring(0, 4)}...</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
export default App;
