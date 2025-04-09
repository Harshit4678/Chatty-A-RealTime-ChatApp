import { create } from "zustand";

export const useVideoCallStore = create((set) => ({
  isVideoCallActive: false,
  setVideoCallActive: (isActive) => set({ isVideoCallActive: isActive }),
}));
