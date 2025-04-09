// filepath: c:\Users\Harshit\OneDrive\Desktop\Web development\CODE WITH HARRY\React course\REACT Projects\chatting webApp\backend\src\index.js
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth.route.js";
import { connectDB } from "./lib/db.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT || 3000;
// Middleware to parse JSON
app.use(express.json());

// Middleware to parse cookies
app.use(cookieParser());

// CORS configuration
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

server.listen(PORT, () => {
  console.log("Server is running on port :" + PORT);
  connectDB();
});
