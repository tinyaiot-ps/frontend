/** @format */
"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/components/ui/nav";
import { Button } from "@/components/ui/button";
import { useTranslation } from "../lib/TranslationContext"; // Import useTranslation
import { useWindowWidth } from "@react-hook/window-size";

import {
  PanelRightClose,
  PanelLeftClose,
  LayoutDashboard,
  MapIcon,
  Route,
  Trash2Icon,
  Settings2,
  CornerLeftUp,
  MessageSquareReply,
} from "lucide-react";

// Handle logout functionality
const handleLogout = () => {
  window.location.href = "/login"; // Redirect to login page (authToken cleared)
};

export default function SideNavbar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>(""); // Track current path manually
  const [isDarkMode, setIsDarkMode] = useState(false); // Track dark mode status
  const city = localStorage.getItem("cityName");
  const type = localStorage.getItem("projectType");
  const onlyWidth = useWindowWidth();
  const mobileWidth = onlyWidth < 768;
  const { t } = useTranslation(); // Translation hook

  // Track the initial load and set the current path & dark mode status
  useEffect(() => {
    setCurrentPath(window.location.pathname); // Set current path
    const darkModeClass = document.documentElement.classList.contains("dark");
    setIsDarkMode(darkModeClass); // Check if dark mode is enabled
  }, []);

  function toggleSidebar() {
    setIsCollapsed(!isCollapsed);
  }

  // Combined navigation links for Overview and Data sections
  const navigationLinks =
    type === "trash"
      ? [
          {
            title: t("menu.dashboard"),
            href: `/projects/${city}/${type}`,
            icon: LayoutDashboard,
          },
          {
            title: t("menu.map"),
            href: `/projects/${city}/${type}/map`,
            icon: MapIcon,
          },
          {
            title: t("menu.route"),
            href: `/projects/${city}/${type}/route`,
            icon: Route,
          },
          {
            title: t("menu.trashbins"),
            href: `/projects/${city}/${type}/trashbins`,
            icon: Trash2Icon,
          },
        ]
      : [
          {
            title: t("menu.dashboard"),
            href: `/projects/${city}/${type}`,
            icon: LayoutDashboard,
          },
        ];

  // Settings links
  const settingsLinks = [
    {
      title: t("menu.project_setting"),
      href: `/projects/${city}/${type}/settings`,
      icon: Settings2,
    },
    {
      title: t("menu.logout"),
      icon: MessageSquareReply,
      href: "/login",
      custom: (
        <Button
          onClick={handleLogout}
          variant="destructive"
          className="w-full text-left"
        >
          {t("menu.logout")}
        </Button>
      ),
    },
  ];

  return (
    <div className="relative min-w-[80px] border-r px-3 pb-10 py-6 flex flex-col justify-between h-screen">
      {!mobileWidth && (
        <div className="absolute right-[-20px] top-7">
          <Button
            onClick={toggleSidebar}
            variant="secondary"
            className="rounded-full p-2"
          >
            {isCollapsed ? <PanelRightClose /> : <PanelLeftClose />}
          </Button>
        </div>
      )}

      <Nav
        isCollapsed={mobileWidth ? true : isCollapsed}
        links={[{ title: t("menu.project"), href: "/projects", icon: CornerLeftUp, variant: "default" }]}
      />

      <div className="flex flex-col gap-4 flex-grow justify-between h-full pb-6">
        <div>
          {navigationLinks.length > 0 && (
            <Nav
              isCollapsed={mobileWidth ? true : isCollapsed}
              links={navigationLinks.map((link) => ({
                ...link,
                className:
                  currentPath === link.href
                    ? isDarkMode
                      ? "bg-white text-black" // Dark mode: white background and black text for active
                      : "bg-blue-600 text-white" // Light mode: blue background and white text for active
                    : isDarkMode
                    ? "text-white hover:bg-gray-700 hover:text-white" // Dark mode hover
                    : "text-black hover:bg-gray-200 hover:text-black", // Light mode hover
              }))}
            />
          )}
        </div>
        <div>
          {settingsLinks.length > 0 && (
            <Nav
              isCollapsed={mobileWidth ? true : isCollapsed}
              links={settingsLinks}
            />
          )}
        </div>
      </div>
    </div>
  );
}
