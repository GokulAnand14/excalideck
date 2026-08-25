import { useState, useEffect } from "react";
import { getAppConfig, setAppConfig } from "../lib/tauri";

export const useTheme = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    getAppConfig().then(config => {
      if (config.theme === "dark" || (config.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
        setTheme("dark");
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        setTheme("light");
        document.documentElement.setAttribute("data-theme", "light");
      }
    }).catch(() => {
        setTheme("light");
        document.documentElement.setAttribute("data-theme", "light");
    });
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    getAppConfig().then(config => {
      setAppConfig({ ...config, theme: newTheme });
    }).catch(() => {});
  };

  return { theme, toggleTheme };
};
