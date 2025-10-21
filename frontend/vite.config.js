import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    hmr: {
      overlay: false, // Disable error overlay that might cause refreshes
    },
    proxy: {
      "/api": {
        target: process.env.VITE_API_BASE_URL, // 👈 Your backend server
        changeOrigin: true,
        secure: false,
        // Strip the leading /api so target already containing /api does not duplicate it
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
