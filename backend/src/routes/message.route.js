import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getMessages,
  getUsersForSidebar,
  sendMessage,
  deleteChat,
  clearChatHistory,
} from "../controllers/message.controller.js";

const messageRoutes = express.Router();

messageRoutes.get("/users", protectRoute, getUsersForSidebar);
messageRoutes.get("/:id", protectRoute, getMessages);
messageRoutes.post("/send/:id", protectRoute, sendMessage);

messageRoutes.delete("/:id", protectRoute, deleteChat);
messageRoutes.delete("/", protectRoute, clearChatHistory);

export default messageRoutes;
