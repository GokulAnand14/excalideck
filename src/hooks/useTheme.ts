import { useState, useEffect } from "react";
import { getAppConfig, setAppConfig } from "../lib/tauri";

const getInitialTheme = (): "light" | "dark" => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
    const dataTheme = document.documentElement.getAttribute("data-theme");
    if (dataTheme === "dark" || dataTheme === "light") return dataTheme;
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  }
  return "dark"; // Defaulting modern desktop to dark
};

export const useTheme = () => {
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);

  useEffect(() => {
    const initial = getInitialTheme();
    document.documentElement.setAttribute("data-theme", initial);
    localStorage.setItem("theme", initial);

    getAppConfig().then(config => {
      if (config.theme === "dark" || (config.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
        setTheme("dark");
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
      } else if (config.theme === "light") {
        setTheme("light");
        document.documentElement.setAttribute("data-theme", "light");
        localStorage.setItem("theme", "light");
      }
    }).catch(() => {
      // Keep initial theme
    });
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    getAppConfig().then(config => {
      setAppConfig({ ...config, theme: newTheme });
    }).catch(() => {});
  };

  return { theme, toggleTheme };
};

