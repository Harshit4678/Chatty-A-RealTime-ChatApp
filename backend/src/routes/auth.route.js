import express from "express";
import {
  checkAuth,
  deleteAccount,
  login,
  logout,
  signup,
  updateProfile,
} from "../controllers/auth.controllers.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.put("/update-profile", protectRoute, updateProfile);

router.delete("/delete-account", protectRoute, deleteAccount);
router.get("/check", protectRoute, checkAuth);

export default router;
