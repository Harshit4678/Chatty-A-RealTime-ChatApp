import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosIntance } from "../lib/axios.js";
import { useAuthStore } from "./useAuthStore.js";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosIntance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosIntance.get(`/messages/${userId}`);
      set({ messages: res.data });
      // Refresh users to update unread counts after opening chat
      get().getUsers();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosIntance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
    } catch (error) {
      console.error(
        "Send message error:",
        error.response?.data || error.message
      );
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    const socket = useAuthStore.getState().socket;
    if (!selectedUser || !socket) return;

    // Remove previous listener to avoid duplicates
    socket.off("newMessage");

    socket.on("newMessage", (newMessage) => {
      console.log("Received newMessage:", newMessage, selectedUser);
      if (newMessage.senderId === selectedUser._id) {
        set({
          messages: [...get().messages, newMessage],
        });
        // Show live indicator for a short time
        if (typeof window !== "undefined" && window.dispatchEvent) {
          console.log("Dispatching show-live-indicator event");
          window.dispatchEvent(new CustomEvent("show-live-indicator"));
        }
      }
      get().getUsers();
    });
  },
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
    }
  },

  initializeSidebarSocket: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", () => {
      get().getUsers();
    });

    // Update: Use seenBy from backend to update correct messages
    socket.on("messagesSeen", ({ seenBy }) => {
      const { messages } = get();
      const myId = useAuthStore.getState().authUser._id;
      const updatedMessages = messages.map((msg) =>
        msg.senderId === myId && msg.receiverId === seenBy
          ? { ...msg, seen: true }
          : msg
      );
      set({ messages: updatedMessages });
    });
  },
  setSelectedUser: (selectedUser) => set({ selectedUser }),

  deleteChat: async (userId) => {
    try {
      await axiosIntance.delete(`/messages/${userId}`);
      set({ messages: [] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  clearChat: async () => {
    try {
      await axiosIntance.delete("/messages");
      set({ messages: [] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },
}));
