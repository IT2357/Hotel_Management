// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{html,js,ts,jsx,tsx}",
  ],
  theme: {
    fontSize: {
      sm: "0.875rem",
      base: "1rem", // default size = 16px
      lg: "1.125rem",
      xl: "1.25rem",
    },
    extend: {
      colors: {
        // VALDORA brand colors - inspired by Jaffna Tamil culture
        'valdora': {
          'red': '#C41E3A',      // Deep red like traditional Jaffna pottery
          'orange': '#D2691E',   // Warm orange like Jaffna sunset
          'gold': '#FFD700',     // Golden yellow like temple bells
          'green': '#228B22',    // Deep green like Jaffna palm groves
          'brown': '#8B4513',    // Earthy brown like cinnamon
          'cream': '#FFF8DC',    // Cream like fresh milk
          'maroon': '#800000',   // Maroon like betel leaves
          'saffron': '#FF9933',  // Saffron like temple offerings
        },
        // Extended color palette for gradients
        'spice': {
          'chili': '#C41E3A',
          'turmeric': '#FFD700',
          'cardamom': '#228B22',
          'cinnamon': '#8B4513',
          'pepper': '#2F4F4F',
        }
      },
      fontFamily: {
        'valdora': ['Noto Sans Tamil', 'serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'valdora-pattern': "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23C41E3A\" fill-opacity=\"0.1\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"2\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
      }
    },
  },
  plugins: [],
};
