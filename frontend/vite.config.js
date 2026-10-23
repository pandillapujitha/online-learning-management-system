import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The app is served from /app (by the Node server in production).
export default defineConfig({
  base: "/app/",
  plugins: [react()],
  server: { port: 5173, proxy: { "/api": "http://localhost:5000" } }
});
