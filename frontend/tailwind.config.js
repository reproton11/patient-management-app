// patient-management-app/frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Font default untuk sebagian besar teks (body text, input, dll.)
        sans: ["Inter", "sans-serif"],
        // Font khusus untuk judul atau elemen yang ingin menonjol
        heading: ["Poppins", "sans-serif"], // <--- Tambahkan ini
      },
    },
  },
  plugins: [],
};
