// import mongoose from "mongoose";

// const PlayerSub = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   telegramId: { type: String, required: true },
//   username: String,
//   status: { type: String, enum: ["joined","ready","disconnected"], default: "joined" },
//   joinedAt: { type: Date, default: Date.now }
// }, { _id: false });

// const RoomSchema = new mongoose.Schema({
//   roomId: { type: String, required: true, unique: true, index: true },
//   creatorUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//   stakeValue: { type: Number, required: true },
//   mode: { type: String, enum: ["classic","quick"], default: "classic" },
//   maxPlayers: { type: Number, enum: [2,4], required: true },
//   status: { type: String, enum: ["waiting","full","playing","ended","cancelled"], default: "waiting" },
//   players: { type: [PlayerSub], default: [] },
//   createdAt: { type: Date, default: Date.now },
//   startedAt: Date,
//   endedAt: Date
// });

// export default mongoose.model("Room", RoomSchema);


import mongoose from "mongoose";

const TokenSchema = new mongoose.Schema({
  position: { type: Number, default: -1 }, // -1 = home
  isFinished: { type: Boolean, default: false },
});

const PlayerSub = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  telegramId: { type: String, required: true },
  username: String,
  color: { type: String, enum: ["red", "green", "yellow", "blue"] },
  status: { type: String, enum: ["joined", "ready", "disconnected"], default: "joined" },
  joinedAt: { type: Date, default: Date.now },
  tokens: { type: [TokenSchema], default: () => Array(4).fill({}) },
}, { _id: false });

const RoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true, index: true },
  creatorUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  stakeValue: { type: Number, required: true },
  mode: { type: String, enum: ["classic", "quick"], default: "classic" },
  maxPlayers: { type: Number, enum: [2, 4], required: true },
  status: { type: String, enum: ["waiting", "full", "playing", "ended", "cancelled"], default: "waiting" },
  players: { type: [PlayerSub], default: [] },
  gameState: {
    currentTurn: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    diceValue: { type: Number, default: null },
    turnOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    started: { type: Boolean, default: false },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  moveHistory: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      tokenIndex: Number,
      from: Number,
      to: Number,
      dice: Number,
      timestamp: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  startedAt: Date,
  endedAt: Date
});

export default mongoose.model("Room", RoomSchema);

