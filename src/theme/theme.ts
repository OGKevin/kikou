import { extendTheme } from "@mui/joy/styles";

// Extend the default Joy UI theme
const theme = extendTheme({
  // You can customize the theme here
  colorSchemes: {
    light: {
      palette: {
        primary: {
          50: "#e3f2fd",
          100: "#bbdefb",
          200: "#90caf9",
          300: "#64b5f6",
          400: "#42a5f5",
          500: "#2196f3",
          600: "#1e88e5",
          700: "#1976d2",
          800: "#1565c0",
          900: "#0d47a1",
        },
      },
    },
    dark: {
      palette: {
        primary: {
          50: "#e3f2fd",
          100: "#bbdefb",
          200: "#90caf9",
          300: "#64b5f6",
          400: "#42a5f5",
          500: "#2196f3",
          600: "#1e88e5",
          700: "#1976d2",
          800: "#1565c0",
          900: "#0d47a1",
        },
      },
    },
  },
  fontFamily: {
    body: '"Inter", "Helvetica", "Arial", sans-serif',
    display: '"Inter", "Helvetica", "Arial", sans-serif',
    code: '"Fira Code", "Consolas", "Monaco", monospace',
  },
});

export default theme;
