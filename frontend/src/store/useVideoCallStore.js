// store/useVideoCallStore.js
import { create } from "zustand";

export const useVideoCallStore = create((set) => ({
  isVideoCallActive: false,
  isInCall: false,
  incomingCall: null,

  setVideoCallActive: (isActive) => set({ isVideoCallActive: isActive }),
  setInCall: (inCall) => set({ isInCall: inCall }),
  setIncomingCall: (call) => set({ incomingCall: call }),
}));
