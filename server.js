const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

let waitingQueue = [];
const matchedPlayers = {};

io.on("connection", (socket) => {
  console.log(`A user connected: ${socket.id}`);

  socket.on("createRoom", (data) => {
    const { roomId, name } = data;
    socket.join(roomId);
    socket.username = name;
    socket.roomId = roomId;
    console.log(`Room ${roomId} created and ${name} joined`);

    socket.to(roomId).emit("userJoined", { name });

    const numUsers = io.sockets.adapter.rooms.get(roomId)?.size || 0;
    io.to(roomId).emit("updateUserCount", numUsers);
  });

  socket.on("joinRoom", (data) => {
    const { roomId, name } = data;
    const numUsers = io.sockets.adapter.rooms.get(roomId)?.size || 0;

    if (numUsers >= 2) {
      socket.emit("roomFull", { message: "The room is already full." });
      return;
    }

    socket.join(roomId);
    socket.username = name;
    socket.roomId = roomId;
    console.log(`${name} joined room ${roomId}`);

    socket.to(roomId).emit("userJoined", { name });

    const usersInRoom = [];
    const roomSockets = io.sockets.adapter.rooms.get(roomId);
    if (roomSockets) {
      roomSockets.forEach((socketId) => {
        const userSocket = io.sockets.sockets.get(socketId);
        if (userSocket && userSocket.username) {
          usersInRoom.push(userSocket.username);
        }
      });
    }

    socket.emit("existingUsers", usersInRoom);

    io.to(roomId).emit("updateUserCount", numUsers + 1);
  });

  socket.on("searchStranger", (data) => {
    const { name } = data;
    console.log("User searching for a stranger");
    waitingQueue.push({ socket, name });
    socket.emit("searching");

    if (waitingQueue.length >= 2) {
      const user1 = waitingQueue.shift();
      const user2 = waitingQueue.shift();
      const roomId = `${user1.socket.id}-${user2.socket.id}`;

      user1.socket.strangerRoomId = roomId;
      user2.socket.strangerRoomId = roomId;

      user1.socket.join(roomId);
      user2.socket.join(roomId);

      user1.socket.emit("matched", { name: user2.name });
      user2.socket.emit("matched", { name: user1.name });

      matchedPlayers[user1.socket.id] = user2.socket.id;
      matchedPlayers[user2.socket.id] = user1.socket.id;

      console.log(`Users matched in room ${roomId}`);
    }
  });

  socket.on("userReady", (data) => {
    const roomId = socket.roomId || socket.strangerRoomId;
    const { ready, chest } = data;

    if (roomId) {
      socket.to(roomId).emit("opponentReady", { ready, chest });
      console.log(`${socket.id} is ready in room ${roomId}`);
    }
  });

  socket.on("userGuess", (data) => {
    const roomId = socket.roomId || socket.strangerRoomId;
    const { Id } = data;

    if (roomId) {
      socket.to(roomId).emit("opponentGuess", { Id });
      console.log(`${socket.id} guessed in room ${roomId}`);
    }
  });

  socket.on("disconnect", () => {
    console.log(`A user disconnected: ${socket.id}`);

    const waitingIndex = waitingQueue.findIndex(
      (entry) => entry.socket.id === socket.id
    );
    if (waitingIndex !== -1) {
      waitingQueue.splice(waitingIndex, 1);
      console.log(`Removed ${socket.id} from waiting queue.`);
    }

    const opponentId = matchedPlayers[socket.id];
    if (opponentId) {
      io.to(opponentId).emit("opponentDisconnected", {
        message: "Your opponent has left the game.",
      });
      delete matchedPlayers[opponentId];
      delete matchedPlayers[socket.id];
    }

    if (socket.roomId) {
      socket.leave(socket.roomId);
      const numUsers = io.sockets.adapter.rooms.get(socket.roomId)?.size || 0;
      io.to(socket.roomId).emit("updateUserCount", numUsers);
      console.log(`User ${socket.id} left room ${socket.roomId}`);
    }
  });
});

server.listen(9080, () => {
  console.log("Server is running on port 9080");
});
