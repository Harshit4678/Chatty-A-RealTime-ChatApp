import { create } from "zustand";
import { useAuthStore } from "./useAuthStore"; // Adjust the path as needed

export const useVideoCallStore = create((set) => ({
  isVideoCallActive: false, // Indicates if the video call UI is active
  isInCall: false, // Indicates if the user is currently in a call
  incomingCall: null, // Stores details of an incoming call

  // Set the video call UI active/inactive
  setVideoCallActive: (isActive) => set({ isVideoCallActive: isActive }),

  // Set the user in a call or not
  setInCall: (inCall) => set({ isInCall: inCall }),

  // Set details of an incoming call
  setIncomingCall: (call) => set({ incomingCall: call }),

  // Clear the incoming call details
  clearIncomingCall: () => set({ incomingCall: null }),

  // Accept an incoming call
  acceptCall: () => {
    set({ isInCall: true, isVideoCallActive: true });
    // Initialize peer connection for callee
    const { socket } = useAuthStore.getState();
    const { incomingCall } = useVideoCallStore.getState();
    socket.emit("accept-call", { to: incomingCall.from._id });
  },

  // Reject an incoming call
  rejectCall: () => {
    set({ incomingCall: null, isVideoCallActive: false });
  },

  // End the current call
  endCall: () => {
    set({ isInCall: false, isVideoCallActive: false, incomingCall: null });
  },
}));
