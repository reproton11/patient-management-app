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
    build: {
      // Pisah vendor berat agar first paint tidak membayar biaya analytics/form sekaligus;
      // react-vendor stabil → cache lama di browser
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return undefined;
            if (id.includes("/framer-motion/")) {
              return "motion-vendor";
            }
            if (id.includes("/recharts/") || id.includes("/d3-")) {
              return "chart-vendor";
            }
            // axios + date-fns tidak mengimpor React → chunk sendiri, tak mungkin siklus
            if (id.includes("/axios/") || id.includes("/date-fns/")) {
              return "utils-vendor";
            }
            // Seluruh ekosistem React dalam satu chunk agar impor timbal-balik
            // (react-select/day-picker → react) tidak menjadi siklus antar-chunk
            if (
              id.includes("/react/") ||
              id.includes("/react-dom") ||
              id.includes("/react-router") ||
              id.includes("/react-select/") ||
              id.includes("/react-day-picker/") ||
              id.includes("/react-toastify/") ||
              id.includes("/scheduler/") ||
              id.includes("/@headlessui/") ||
              id.includes("/@base-ui/")
            ) {
              return "react-vendor";
            }
            return undefined;
          },
        },
      },
    },
  };
});
