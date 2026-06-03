"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type ThemeContextType = {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkModeState] = useState(false);

  const setIsDarkMode = (val: boolean) => {
    setIsDarkModeState(val);
    if (typeof document !== "undefined") {
      if (val) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem("theme");
      // Cek apakah sistem user mode gelap (opsional, tapi bagus)
      const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (storedTheme === "dark" || (!storedTheme && systemPrefersDark)) {
        setIsDarkModeState(true);
        document.documentElement.classList.add("dark");
      } else {
        setIsDarkModeState(false);
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
