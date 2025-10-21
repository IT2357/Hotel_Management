import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";
import { loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const rawTarget = env.VITE_API_BASE_URL || "http://localhost:5000";
  const hasApiPath = /\/(api)(\/|$)/.test(new URL(rawTarget, "http://dummy").pathname);

  return {
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
          target: rawTarget, // can be http://host or http://host/api
          changeOrigin: true,
          secure: false,
          // If target already includes /api, strip it from incoming path. Otherwise, keep /api in path.
          rewrite: (path) => path.replace(/^\/api/, hasApiPath ? "" : "/api"),
        },
      },
    },
  };
});
