import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: true,
    proxy: {
      "/nvidia-api": {
        target: "https://integrate.api.nvidia.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/nvidia-api/, ""),
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Build Web Workers as classic IIFE scripts (not ES Modules).
  // This is required because @mediapipe/hands internally calls importScripts(),
  // which is only available in classic workers — not ES Module workers.
  worker: {
    format: "iife",
  },
}));
