import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';

// NOTE: Ensure this URL matches the port your server.js is running on (e.g., 3000)
const SOCKET_SERVER_URL = "http://localhost:5001"; 
const socket = io(SOCKET_SERVER_URL, {
    autoConnect: false
});

// --- UI Constants and Helpers ---

/**
 * Maps player colors to Tailwind classes for background, border, and text.
 */
const COLOR_MAP = {
    red: { bg: 'bg-red-600', border: 'border-red-800', hover: 'hover:bg-red-700', text: 'text-red-400', ring: 'ring-red-500' },
    green: { bg: 'bg-green-600', border: 'border-green-800', hover: 'hover:bg-green-700', text: 'text-green-400', ring: 'ring-green-500' },
    blue: { bg: 'bg-blue-600', border: 'border-blue-800', hover: 'hover:bg-blue-700', text: 'text-blue-400', ring: 'ring-blue-500' },
    yellow: { bg: 'bg-yellow-500', border: 'border-yellow-700', hover: 'hover:bg-yellow-600', text: 'text-yellow-300', ring: 'ring-yellow-400' },
};

/**
 * A simple visual representation of a Ludo token.
 */
const Token = ({ color, tokenIndex, onClick, isMovable }) => {
    const colorClasses = COLOR_MAP[color] || COLOR_MAP.red;
    
    const className = `
        w-8 h-8 rounded-full shadow-lg transition-all duration-150 transform 
        ${colorClasses.bg} border-2 ${colorClasses.border}
        flex items-center justify-center font-bold text-white
        ${isMovable 
            ? `cursor-pointer ${colorClasses.hover} ring-offset-2 ring-opacity-75 ring-4 ${colorClasses.ring} hover:scale-110` 
            : 'cursor-default opacity-80'
        }`;
    
    return (
        <div 
            className={className}
            onClick={isMovable ? () => onClick(tokenIndex) : null}
            title={isMovable ? "Click to move" : "Token"}
        >
            <span className="text-sm">
                {tokenIndex + 1}
            </span>
        </div>
    );
};

/**
 * Displays the player's tokens and current status.
 */
const PlayerYard = ({ player, onTokenClick, isCurrentPlayer, gameState }) => {
    const color = player.color;
    const colorClasses = COLOR_MAP[color] || COLOR_MAP.red;

    const tokensInYard = player.tokens.filter(pos => pos === 0).length;
    const tokensAtHome = player.tokens.filter(pos => pos === 58).length;
    
    const isWaitingForMove = gameState?.status === 'waiting_for_move';
    const diceValue = gameState?.diceValue;

    // Determine which tokens are visually clickable on the client side
    const movableTokens = useMemo(() => {
        if (!isCurrentPlayer || !isWaitingForMove) return new Set();
        
        const set = new Set();
        player.tokens.forEach((pos, index) => {
            // Must have rolled a 6 to move from yard (pos=0)
            if (pos === 0 && diceValue === 6) {
                set.add(index);
            } 
            // Any token on the path (1-57) can be *clicked*. Server validates legality.
            else if (pos > 0 && pos < 58) { 
                set.add(index);
            }
        });
        return set;
    }, [player.tokens, isCurrentPlayer, isWaitingForMove, diceValue]);

    // Format for tokens on path/home column (1-57)
    const pathTokens = player.tokens
        .map((pos, index) => ({ pos, index }))
        .filter(t => t.pos > 0 && t.pos < 58);

    return (
        <div className={`
            p-6 rounded-2xl shadow-2xl w-full max-w-sm 
            bg-gray-800 border-4 transition-all duration-300 transform 
            ${isCurrentPlayer ? `${colorClasses.border} scale-[1.02] border-opacity-100` : 'border-gray-700 border-opacity-70'}
        `}>
            <h3 className={`text-xl font-extrabold mb-3 ${colorClasses.text}`}>
                {color.toUpperCase()} {isCurrentPlayer ? '[YOUR TURN]' : ''}
            </h3>
            
            <div className="space-y-4">
                
                {/* Yard Tokens (Position 0) */}
                <div className="bg-gray-700/50 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-gray-300 mb-2 flex justify-between items-center">
                        <span>Yard (Start)</span>
                        <span className="font-mono text-lg">{tokensInYard} / 4</span>
                    </p>
                    <div className="flex flex-wrap gap-3">
                        {player.tokens.map((pos, index) => 
                            pos === 0 && (
                                <Token 
                                    key={`yard-${index}`} 
                                    color={color} 
                                    tokenIndex={index} 
                                    onClick={onTokenClick}
                                    isMovable={movableTokens.has(index)}
                                />
                            )
                        )}
                    </div>
                </div>

                {/* Path & Home Column Tokens (Position 1-57) */}
                <div className="bg-gray-700/50 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-gray-300 mb-2 flex justify-between items-center">
                        <span>On Board (Path/Home)</span>
                        <span className="font-mono text-lg">{pathTokens.length}</span>
                    </p>
                    <div className="flex flex-wrap gap-3 mb-2">
                        {pathTokens.map(token => (
                            <Token 
                                key={`path-${token.index}`} 
                                color={color} 
                                tokenIndex={token.index} 
                                onClick={onTokenClick}
                                isMovable={movableTokens.has(token.index)}
                            />
                        ))}
                    </div>
                    {pathTokens.length > 0 && (
                         <div className="text-xs text-gray-400 flex flex-wrap gap-x-3 mt-1">
                            {pathTokens.map(t => (
                                <span key={t.index}>T{t.index + 1}: P{t.pos}</span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Finished Tokens (Position 58) */}
                <div className="bg-gray-700/50 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-gray-300 mb-2 flex justify-between items-center">
                        <span>Finished (Center)</span>
                        <span className="font-mono text-lg text-yellow-300">{tokensAtHome} / 4</span>
                    </p>
                    <div className="flex flex-wrap gap-3">
                        {player.tokens.map((pos, index) => 
                            pos === 58 && (
                                <Token 
                                    key={`finish-${index}`} 
                                    color={color} 
                                    tokenIndex={index} 
                                    isMovable={false}
                                />
                            )
                        )}
                    </div>
                </div>
            </div>
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

    const currentPlayer = gameState?.players?.[gameState.currentPlayerIndex];
    const isCurrentPlayer = currentPlayer?.id === socket.id;
    const myPlayer = gameState?.players.find(p => p.id === socket.id);

    // Dynamic border highlight for the current player's turn
    const borderClass = useMemo(() => {
        if (myPlayer) {
            return COLOR_MAP[myPlayer.color]?.ring || 'ring-gray-800';
        }
        return 'ring-gray-800';
    }, [myPlayer]);

    // --- Socket Event Listeners ---
    useEffect(() => {
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

        socket.on('gameStateUpdate', (state) => {
            // Check if the state is changing to 'waiting_for_roll' (new turn)
            if (state.status === 'waiting_for_roll' && gameState?.status !== 'waiting_for_roll') {
                setDiceDisplay(null); // Clear dice display for the new player's turn
            }
            setGameState(state);
            console.log("State Updated:", state.message);
        });

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
            socket.off('gameStateUpdate');
            socket.off('playerJoined');
            socket.off('diceRolled');
            socket.off('gameError');
            socket.off('gameOver');
        };
    }, [gameState]); 

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
        if (!gameState || !isCurrentPlayer || gameState.status !== 'waiting_for_move') {
            setError("It's not your turn or you need to roll first.");
            return;
        }
        // IMPORTANT: Clear error before sending action
        setError(null);
        socket.emit('moveToken', { roomCode, tokenIndex });
    }, [gameState, isCurrentPlayer, roomCode]);

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
                        className="w-full py-3 bg-teal-600 rounded-lg font-bold text-lg shadow-teal-500/50 hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:shadow-none"
                    >
                        {isConnected ? 'Join Game' : 'Connect & Join'}
                    </button>
                    
                    {error && (
                        <p className="mt-4 text-red-400 text-sm text-center bg-red-900/30 p-2 rounded-lg border border-red-800">{error}</p>
                    )}
                    
                    {numPlayers > 0 && (
                        <p className="mt-4 text-sm text-gray-400 text-center">
                            Players currently in room: {numPlayers}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    const currentTurnColor = currentPlayer?.color.toUpperCase();
    const myColorClasses = COLOR_MAP[myPlayer?.color] || COLOR_MAP.red;

    // 2. Game Screen
    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 font-inter">
            
            {/* Header */}
            <header className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-teal-400">
                    <span role="img" aria-label="board game">♟️</span> Ludo Room: {roomCode}
                </h1>
                <p className={`text-gray-400 text-sm mt-1 ring-2 ring-offset-2 ring-offset-gray-900 p-1 px-3 rounded-full inline-block ${myColorClasses.ring}`}>
                    You are **{myPlayer?.color.toUpperCase()}** (ID: <span className='font-mono text-xs'>{socket.id}</span>)
                </p>
            </header>

            {/* Game Status & Controls Panel */}
            <div className={`bg-gray-800 p-6 rounded-2xl shadow-xl max-w-3xl mx-auto mb-8 ring-4 ${borderClass} ring-offset-4 ring-offset-gray-900 transition-shadow duration-500`}>
                
                <div className="text-center mb-4">
                    <p className="text-xl font-semibold">
                        {gameState.status === 'game_over' ? (
                            <span className="text-yellow-400 animate-pulse text-3xl font-black">{gameState.message}</span>
                        ) : (
                            <span>
                                Current Turn: 
                                <span className={`font-bold ml-2 ${COLOR_MAP[currentPlayer?.color]?.text || 'text-white'}`}>{currentTurnColor}</span>
                                {isCurrentPlayer && <span className='text-sm text-teal-400 ml-2'>(Your Move)</span>}
                            </span>
                        )}
                    </p>
                    <p className="text-sm text-gray-400 mt-2 italic">{gameState.message}</p>
                    {gameState.lastAction && <p className="text-xs text-gray-500 mt-1">Last Action: {gameState.lastAction}</p>}
                </div>

                <div className="flex justify-center items-center space-x-8 mt-6">
                    {/* Dice Display */}
                    <div className="flex flex-col items-center">
                        <div className={`text-6xl font-black p-4 rounded-xl border-4 border-gray-600 bg-gray-700 shadow-inner w-28 h-28 flex items-center justify-center ${diceDisplay === 6 ? 'text-yellow-400 animate-bounce-slow' : 'text-white'}`}>
                            {diceDisplay !== null ? diceDisplay : '?'}
                        </div>
                        <p className="text-sm mt-2 text-gray-400">Dice Roll</p>
                    </div>

                    {/* Roll Button */}
                    <button
                        onClick={handleRollDice}
                        disabled={!isCurrentPlayer || gameState.status !== 'waiting_for_roll' || gameState.status === 'game_over'}
                        className="px-8 py-4 bg-teal-600 rounded-xl font-bold text-lg shadow-xl shadow-teal-500/30 hover:bg-teal-700 transition-all transform hover:scale-105 disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                        {gameState.status === 'game_over' ? 'Game Over' : (isCurrentPlayer ? 'ROLL DICE' : 'Waiting...')}
                    </button>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <p className="mt-4 text-red-400 text-center text-lg bg-red-900/30 p-3 rounded-xl max-w-xl mx-auto border border-red-800 animate-shake">
                    <span className="font-bold mr-2">ERROR:</span> {error}
                </p>
            )}

            {/* Player Boards/Yards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 justify-center max-w-6xl mx-auto mt-8">
                {gameState.players.map((player) => (
                    <PlayerYard
                        key={player.id}
                        player={player}
                        gameState={gameState}
                        onTokenClick={handleTokenClick}
                        isCurrentPlayer={player.id === socket.id}
                    />
                ))}
            </div>

            <footer className="mt-12 text-center text-gray-600 text-xs">
                <p>Ensure your server is running on {SOCKET_SERVER_URL}.</p>
            </footer>
        </div>
    );
};

export default App;

