import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Pastikan tidak ada "base" property di sini, atau komentar jika ada
  // base: '/your-app-path/',
  server: {
    // Hapus atau komentar blok proxy ini jika ada, kecuali jika Anda memang membutuhkannya untuk deploy
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:5000', // Ini hanya untuk dev lokal
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/api/, '')
    //   }
    // }
  },
});
