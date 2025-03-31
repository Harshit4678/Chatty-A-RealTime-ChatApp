// @ts-ignore
import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      "light", // Default light theme
      "dark", // Default dark theme
      "cupcake", // Cute pastel theme
      "bumblebee", // Yellow and black theme
      "emerald", // Green and white theme
      "corporate", // Professional theme
      "synthwave", // Retro neon theme
      "retro", // Vintage theme
      "cyberpunk", // Futuristic theme
      "valentine", // Pink and red theme
      "halloween", // Orange and black theme
      "garden", // Green and earthy theme
      "forest", // Dark green theme
      "aqua", // Blue and white theme
      "lofi", // Minimalist theme
      "pastel", // Soft pastel colors
      "fantasy", // Vibrant fantasy theme
      "wireframe", // Monochrome wireframe theme
      "black", // Pure black theme
      "luxury", // Gold and black theme
      "dracula", // Purple and dark theme
      "cmyk", // Cyan, magenta, yellow, black theme
      "autumn", // Warm autumn colors
      "business", // Neutral professional theme
      "acid", // Bright acid colors
      "lemonade", // Yellow and pink theme
      "night", // Dark blue theme
      "coffee", // Brown and cream theme
      "winter", // Cool winter colors
    ],
  },
};
