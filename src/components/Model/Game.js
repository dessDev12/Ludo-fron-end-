// // import mongoose from "mongoose";

// // const gameSchema = new mongoose.Schema({
// //   roomId: { type: String, required: true, unique: true },
// //   players: [
// //     {
// //       telegramId: { type: String, required: true },
// //       username: String,
// //       color: String,
// //       joinedAt: { type: Date, default: Date.now }
// //     }
// //   ],
// //   state: { type: String, default: "waiting" }, // waiting, active, finished
// //   createdAt: { type: Date, default: Date.now }
// // });

// // export default mongoose.model("Game", gameSchema);
// import mongoose from "mongoose";

// const PlayerSubSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   telegramId: { type: String, required: true },
//   username: { type: String },
//   color: { type: String },
//   tokens: { type: [Number], default: [] },
//   joinedAt: { type: Date, default: Date.now }
// }, { _id: false });

// const gameSchema = new mongoose.Schema({
//   roomId: { type: String, required: true, unique: true },
//   players: { type: [PlayerSubSchema], required: true },
//   turnIndex: { type: Number, default: 0 },
//   diceRolls: { type: Array, default: [] },
//   moves: { type: Array, default: [] },
//   status: { type: String, enum: ["waiting","playing","ended"], default: "waiting" },
//   createdAt: { type: Date, default: Date.now }
// });

// export default mongoose.model("Game", gameSchema);

import mongoose from "mongoose";

const TokenSchema = new mongoose.Schema({
  position: { type: Number, default: -1 }, // -1 = in home
  isFinished: { type: Boolean, default: false },
});

const PlayerSubSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  telegramId: { type: String, required: true },
  username: { type: String },
  color: { type: String, enum: ["red", "green", "yellow", "blue"] },
  tokens: { type: [TokenSchema], default: () => Array(4).fill({}) },
  joinedAt: { type: Date, default: Date.now }
}, { _id: false });

const gameSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  players: { type: [PlayerSubSchema], required: true },
  currentTurnUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  turnIndex: { type: Number, default: 0 },
  lastDiceValue: { type: Number, default: null },
  diceRolls: { type: [Number], default: [] },
  moves: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      tokenIndex: Number,
      from: Number,
      to: Number,
      dice: Number,
      timestamp: { type: Date, default: Date.now }
    }
  ],
  winnerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["waiting", "playing", "ended"], default: "waiting" },
  createdAt: { type: Date, default: Date.now },
  startedAt: { type: Date },
  endedAt: { type: Date }
});

export default mongoose.model("Game", gameSchema);

