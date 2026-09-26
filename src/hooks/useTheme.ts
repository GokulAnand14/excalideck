import { useState, useEffect } from "react";
import { getAppConfig, setAppConfig } from "../lib/tauri";

const getInitialTheme = (): "light" | "dark" => {
  if (typeof window !== "undefined") {
    const userChosen = localStorage.getItem("theme_user_chosen");
    if (userChosen === "true") {
      const saved = localStorage.getItem("theme");
      if (saved === "dark" || saved === "light") return saved;
    }
  }
  return "dark"; // Always default to dark mode
};

export const useTheme = () => {
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);

  useEffect(() => {
    const initial = getInitialTheme();
    document.documentElement.setAttribute("data-theme", initial);
    localStorage.setItem("theme", initial);

    getAppConfig().then(config => {
      const userChosen = localStorage.getItem("theme_user_chosen");
      if (userChosen === "true" && config.theme === "light") {
        setTheme("light");
        document.documentElement.setAttribute("data-theme", "light");
        localStorage.setItem("theme", "light");
      } else {
        setTheme("dark");
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
        if (config.theme !== "dark") {
          setAppConfig({ ...config, theme: "dark" }).catch(() => {});
        }
      }
    }).catch(() => {
      setTheme("dark");
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    });
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    localStorage.setItem("theme_user_chosen", "true");
    getAppConfig().then(config => {
      setAppConfig({ ...config, theme: newTheme });
    }).catch(() => {});
  };

  return { theme, toggleTheme };
};

