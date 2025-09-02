// patient-management-app/frontend/vite.config.js
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Memuat variabel lingkungan dari file .env atau Vercel
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    // Bagian KRUSIAL: Secara eksplisit mendefinisikan variabel lingkungan
    define: {
      "import.meta.env.VITE_API_BASE_URL": JSON.stringify(
        env.VITE_API_BASE_URL
      ),
    },
    server: {
      proxy: {
        // Ini hanya untuk development lokal
        "/api": {
          target: env.VITE_API_BASE_URL || "http://localhost:5000/api",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});
