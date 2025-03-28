"use client";

import React from "react";
import { useTheme } from "@/lib/ThemeContext"; // Import Theme Context
import { Sun, Moon } from "lucide-react"; // Import Icons

export default function ThemeSwitcher() {
  // Access theme and toggle function from context
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="theme-switcher-container">
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="icon-button"
        title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`} // Tooltip for accessibility
      >
        {theme === "light" ? (
          <Moon className="h-6 w-6 text-gray-600" />
        ) : (
          <Sun className="h-6 w-6 text-yellow-500" />
        )}
      </button>
    </div>
  );
}
