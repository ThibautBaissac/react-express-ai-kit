import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Forward API calls to the Express server during dev.
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
