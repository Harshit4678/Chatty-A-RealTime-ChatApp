import { create } from "zustand";
import { axiosIntance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
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
      get().connectSocket(); // connect after auth
    } catch {
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

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: { userId: authUser._id },
    });

    socket.connect();
    set({ socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    // ✅ Important: incoming-call listener for receiver
    socket.on("incoming-call", ({ from, offer, senderSocketId }) => {
      const { socket } = get();
      const { setIncomingCall, setVideoCallActive } =
        useVideoCallStore.getState();

      if (socket.id === senderSocketId) return; // ignore own call

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
