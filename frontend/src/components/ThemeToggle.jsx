import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";
import "../styles/ThemeToggle.css";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={`theme-toggle ${isDark ? "theme-toggle--dark" : ""}`}
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="theme-toggle__thumb">
        <Sun size={11} className="theme-toggle__icon theme-toggle__icon--sun" />
        <Moon size={11} className="theme-toggle__icon theme-toggle__icon--moon" />
      </span>
    </button>
  );
}
