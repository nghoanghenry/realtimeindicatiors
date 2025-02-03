import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import Klines from "./klines.js";

const PORT = 4000;
const app = express();

// CORS middleware
app.use(cors());

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Socket io proxy
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Initialize BinanceKlineWS
const binanceKlineWS = new Klines();

// Handle socket.io connections
io.on("connection", (socket) => {
  console.log("A user connected");

  // Send historical klines data to the new client
  socket.emit("kline", binanceKlineWS.getKlines());

  // Listen to real-time kline updates
  binanceKlineWS.onKline = (kline) => {
    socket.emit("kline", kline);
  };

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});
