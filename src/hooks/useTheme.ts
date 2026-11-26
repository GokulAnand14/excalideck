import { useState, useEffect, useCallback } from "react";
import { getAppConfig, setAppConfig } from "../lib/tauri";

const getInitialTheme = (): "light" | "dark" => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
  }
  return "dark";
};

export const useTheme = () => {
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);

  useEffect(() => {
    const initial = getInitialTheme();
    document.documentElement.setAttribute("data-theme", initial);

    getAppConfig()
      .then((config) => {
        const persisted = config.theme === "light" || config.theme === "dark" ? config.theme : "dark";
        setTheme(persisted);
        document.documentElement.setAttribute("data-theme", persisted);
        localStorage.setItem("theme", persisted);
      })
      .catch(() => {
        document.documentElement.setAttribute("data-theme", initial);
      });
  }, []);

  const setThemeValue = useCallback((newTheme: "light" | "dark") => {
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    getAppConfig()
      .then((config) => setAppConfig({ ...config, theme: newTheme }))
      .catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const newTheme = prev === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
      getAppConfig()
        .then((config) => setAppConfig({ ...config, theme: newTheme }))
        .catch(() => {});
      return newTheme;
    });
  }, []);

  return { theme, toggleTheme, setTheme: setThemeValue };
};
