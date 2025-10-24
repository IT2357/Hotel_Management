import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";
import { loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const rawTarget = env.VITE_API_BASE_URL || "http://localhost:5000";

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      port: 5173,
      hmr: {
        overlay: false, // Disable error overlay that might cause refreshes
      },
      proxy: {
        "/api": {
          target: rawTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});