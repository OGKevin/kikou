import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { setTheme } from "@tauri-apps/api/app";
import { useColorScheme } from "@mui/joy";

export type Theme = "light" | "dark" | "system";

interface ThemeContextProps {
  mode: Theme | undefined;
  setMode: (mode: Theme) => void;
  mounted: boolean;
  resolvedMode: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mounted, setMounted] = useState(false);
  const { mode, setMode, systemMode } = useColorScheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchTheme = async () => {
      if (!mounted) return;

      if (mode === "system") {
        await setTheme(systemMode);
        return;
      }

      let theme: Theme | null | undefined = null;

      if (mode === "light" || mode === "dark") {
        theme = mode;
      }

      await setTheme(theme);
      setMode(mode ?? null);
    };

    fetchTheme();
  }, [mode, mounted, setMode, systemMode]);

  // Always resolve to either "light" or "dark"
  const resolvedMode: "light" | "dark" = useMemo(() => {
    if (mode === "system") {
      return systemMode ?? "dark";
    }

    if (mode === "light" || mode === "dark") {
      return mode;
    }

    return "dark";
  }, [mode, systemMode]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, mounted, resolvedMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) throw new Error("useTheme must be used within ThemeProvider");

  return context;
};
