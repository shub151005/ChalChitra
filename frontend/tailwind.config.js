/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        cinemaBlack: "#070707",
        cinemaPanel: "#111116",
        cinemaCard: "#17171F",
        cinemaBorder: "rgba(255,255,255,0.08)",
        cinemaGold: "#D4AF37",
        cinemaGoldSoft: "#C6A15B",
        cinemaRed: "#B91C1C",
        cinemaText: "#FFFFFF",
        cinemaMuted: "#B5B5C3",
        cinemaDim: "#777787"
      },
      fontFamily: {
        display: ["Playfair Display", "serif"],
        body: ["Inter", "sans-serif"]
      },
      boxShadow: {
        cinemaGlow: "0 0 40px rgba(212, 175, 55, 0.18)",
        cardGlow: "0 20px 60px rgba(0,0,0,0.45)"
      },
      backgroundImage: {
        cinemaGradient:
          "linear-gradient(135deg, rgba(7,7,7,0.95), rgba(17,17,22,0.92), rgba(54,37,8,0.35))"
      }
    }
  },
  plugins: []
};