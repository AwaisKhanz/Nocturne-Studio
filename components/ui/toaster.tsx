"use client";

import { useToast } from "@/components/ui/use-toast";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:top-auto sm:bottom-0 sm:right-0 sm:flex-col sm:w-auto sm:max-w-[420px]">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="group pointer-events-auto relative mb-2 flex w-full items-center justify-between space-x-4 overflow-hidden rounded-2xl border theme-border glass-panel p-4 pr-8 shadow-lg transition-all"
          >
            <div className="grid gap-1">
              {toast.title && (
                <div className="text-sm font-semibold theme-text-primary">
                  {toast.title}
                </div>
              )}
              {toast.description && (
                <div className="text-sm theme-text-muted">
                  {toast.description}
                </div>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="absolute right-2 top-2 rounded-md p-1 theme-text-muted opacity-0 transition-opacity hover:theme-text-primary group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 theme-ring"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
