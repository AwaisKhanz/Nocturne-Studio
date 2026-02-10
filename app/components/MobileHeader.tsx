"use client";

import { Menu, Moon, Sun } from "lucide-react";
import { APP_NAME, APP_TITLE } from "@/app/config";

export function MobileHeader({
  theme,
  onOpenSidebar,
  onToggleTheme,
}: {
  theme: "dark" | "light";
  onOpenSidebar: () => void;
  onToggleTheme: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b theme-divider theme-overlay px-5 py-4 backdrop-blur-2xl lg:hidden">
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] theme-text-faint">
          {APP_NAME}
        </p>
        <h1 className="text-lg font-semibold">{APP_TITLE}</h1>
      </div>
      <div className="flex items-center gap-2">
      <button
        onClick={onOpenSidebar}
        className="flex h-10 w-10 items-center justify-center rounded-full theme-surface-ghost theme-text-muted"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <button
        onClick={onToggleTheme}
        className="ml-2 flex h-10 w-10 items-center justify-center rounded-full theme-surface-ghost theme-text-muted"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        </div>
    </div>
  );
}
