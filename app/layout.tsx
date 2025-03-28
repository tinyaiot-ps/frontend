"use client";

import { ThemeProvider, useTheme } from "@/lib/ThemeContext";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { Inter } from "next/font/google";
import { TranslationProvider } from "../lib/TranslationContext";
import "../app/globals.css"
import { cn } from "../lib/utils";
import SideNavbar from "@/components/SideNavbar";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useEffect, useState } from "react";
//import { useTheme } from "@/lib/ThemeContext";


const inter = Inter({ subsets: ["latin"] });

type HistoryStateArguments = [data: any, unused: string, url?: string | URL | null | undefined];

const overrideHistoryMethods = () => {
  const pushState = history.pushState;
  history.pushState = function (...args: HistoryStateArguments) {
    const result = pushState.apply(this, args);
    window.dispatchEvent(new Event("pushstate"));
    window.dispatchEvent(new Event("locationchange"));
    return result;
  };

  const replaceState = history.replaceState;
  history.replaceState = function (...args: HistoryStateArguments) {
    const result = replaceState.apply(this, args);
    window.dispatchEvent(new Event("replacestate"));
    window.dispatchEvent(new Event("locationchange"));
    return result;
  };

  window.addEventListener("popstate", () => {
    window.dispatchEvent(new Event("locationchange"));
  });
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showNavigation, setShowNavigation] = useState(false);
  const [token, setToken] = useState<string>("");

  const [loading, setLoading] = useState(true);

  // Add mounted state
  const [mounted, setMounted] = useState(false);

  // Set mounted to true after client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    overrideHistoryMethods();
    const storedToken = localStorage.getItem("authToken");
    if (storedToken) setToken(storedToken);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading) return;
    const pathname = window.location.pathname;
    const noAuthPaths = ["/login"];
    if (!token && !noAuthPaths.includes(pathname)) {
      window.location.href = "/login";
    }
  }, [token, loading]);

  useEffect(() => {
    const noNavigationPaths = ["/login", "/projects"];

    const handlePathChange = () => {
      const pathname = window.location.pathname;
      setShowNavigation(!noNavigationPaths.includes(pathname));
    };

    handlePathChange();
    window.addEventListener("locationchange", handlePathChange);

    return () => {
      window.removeEventListener("locationchange", handlePathChange);
    };
  }, []);

  const { theme } = useTheme(); // Get theme context

   // Prevent rendering until mounted to avoid hydration errors
   if (!mounted) {
    return null; // Return nothing until mounted
  }

return (
  <ThemeProvider> 
    <html lang="en" data-theme={theme}>
      <head>
        <title>TinyAIoT Dashboard</title>
      </head>
      <body
        className={cn(
          `min-h-screen w-full flex ${
            theme === "dark" ? "bg-black text-white" : "bg-white text-black"
          }`,
          inter.className,
          {
            "debug-screens": process.env.NODE_ENV === "development",
          }
        )}
      >

      
        <TranslationProvider>
          {/* Language Switcher in the Header */}
          <header className="flex justify-end p-4 bg-gray-100">
            <LanguageSwitcher />
            <ThemeSwitcher />
          </header>
          {showNavigation && (
            <div className="h-screen">
              <SideNavbar />
            </div>
          )}
          <main className="p-8 w-full">{children}</main>
        </TranslationProvider>
     
      </body>
    </html>
  </ThemeProvider>
  );
}
