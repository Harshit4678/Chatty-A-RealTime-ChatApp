import { create } from "zustand";
import axios from "axios";
import { axiosIntance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
// import { useChatStore } from "./useChatStore.js";
import { useVideoCallStore } from "./useVideoCallStore.js";

const BASE_URL =
  import.meta.env.MODE === "development" ? "http://localhost:3000" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,

  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosIntance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch {
      // Only show "Session expired" if the user was previously logged in
      if (get().authUser) {
        toast.error("Session expired. Please log in again.");
      }
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosIntance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosIntance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosIntance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const response = await axios.put(
        "http://localhost:3000/api/auth/update-profile",
        data,
        { withCredentials: true }
      );
      set({ authUser: response.data }); // Update the user state
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error(
        "Error updating profile:",
        error.response?.data || error.message
      );
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });

    socket.connect();
    set({ socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    // Listen for incoming calls
    socket.on("incoming-call", ({ from, offer }) => {
      const { setIncomingCall, setVideoCallActive } =
        useVideoCallStore.getState();
      setIncomingCall({ from, offer });
      setVideoCallActive(true);
    });

    socket.on("call-error", ({ message }) => {
      toast.error(message);
    });

    socket.on("call-ended", () => {
      const { setInCall, setVideoCallActive, setIncomingCall } =
        useVideoCallStore.getState();
      setInCall(false);
      setVideoCallActive(false);
      setIncomingCall(null);
    });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
