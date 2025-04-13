import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

// Used to store online users
const userSocketMap = {}; // { userId: socketId }

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  }

  // Handle call initiation
  socket.on("call-user", ({ offer, to, from }) => {
    const receiverSocketId = getReceiverSocketId(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("incoming-call", {
        from,
        offer,
        senderSocketId: socket.id,
      });
    } else {
      io.to(socket.id).emit("call-error", { message: "User is offline." });
    }
  });

  // Handle call acceptance
  socket.on("accept-call", ({ to, answer }) => {
    const receiverSocketId = getReceiverSocketId(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call-accepted", { answer });
    }
  });

  // Handle call rejection
  socket.on("reject-call", ({ to }) => {
    const receiverSocketId = getReceiverSocketId(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call-rejected");
    }
  });

  // Handle ICE candidate exchange
  socket.on("send-ice-candidate", ({ candidate, to }) => {
    const receiverSocketId = getReceiverSocketId(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receive-ice-candidate", { candidate });
    }
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    for (const [userId, socketId] of Object.entries(userSocketMap)) {
      if (socketId === socket.id) {
        delete userSocketMap[userId];
        break;
      }
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
