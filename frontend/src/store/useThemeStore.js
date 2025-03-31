import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("chat-theme") || "coffee", // Default theme
  setTheme: (theme) => {
    localStorage.setItem("chat-theme", theme); // Save theme to localStorage
    set({ theme }); // Update the state
  },
}));
