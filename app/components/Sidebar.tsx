"use client";

import React from "react";
import { createPortal } from "react-dom";
import {
  Eye,
  EyeOff,
  MessageSquare,
  Moon,
  MoreHorizontal,
  MoreVertical,
  Pencil,
  Plus,
  Settings,
  ShieldCheck,
  Sun,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import { APP_NAME, APP_TITLE } from "@/app/config";
import type { Session } from "@/app/providers";

type DraftKeys = {
  openai: string;
  google: string;
  xai: string;
};

export function Sidebar({
  className,
  isOpen,
  onClose,
  theme,
  onToggleTheme,
  isKeyVaultOpen,
  setIsKeyVaultOpen,
  draftKeys,
  setDraftKeys,
  showKeys,
  setShowKeys,
  keyErrors,
  onSaveKeys,
  onClearKeys,
  fxEnabled,
  onToggleFx,
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onRenameSession,
  onDeleteSession,
}: {
  className?: string;
  isOpen: boolean;
  onClose: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  isKeyVaultOpen: boolean;
  setIsKeyVaultOpen: (open: boolean) => void;
  draftKeys: DraftKeys;
  setDraftKeys: React.Dispatch<React.SetStateAction<DraftKeys>>;
  showKeys: { openai: boolean; google: boolean; xai: boolean };
  setShowKeys: React.Dispatch<
    React.SetStateAction<{ openai: boolean; google: boolean; xai: boolean }>
  >;
  keyErrors: Record<keyof DraftKeys, string>;
  onSaveKeys: () => void;
  onClearKeys: () => void;
  fxEnabled: boolean;
  onToggleFx: () => void;
  sessions: Session[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onRenameSession: (id: string, title: string) => void;
  onDeleteSession: (id: string) => void;
}) {
  const sidebarSectionClass =
    "space-y-3 ";
  const sidebarListClass = "space-y-2";
  const [renameTarget, setRenameTarget] = React.useState<Session | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<Session | null>(null);
  const [contextMenu, setContextMenu] = React.useState<{
    sessionId: string;
    x: number;
    y: number;
  } | null>(null);

  const handleStartRename = (session: Session) => {
    setRenameTarget(session);
    setRenameValue(session.title);
  };

  const handleConfirmRename = () => {
    if (!renameTarget) return;
    const next = renameValue.trim();
    if (!next) return;
    onRenameSession(renameTarget.id, next);
    setRenameTarget(null);
  };

  const handleDeleteSession = (session: Session) => {
    setDeleteTarget(session);
  };

  const menuStyle = React.useMemo(() => {
    if (!contextMenu) return undefined;
    if (typeof window === "undefined") {
      return { left: contextMenu.x, top: contextMenu.y };
    }
    const menuWidth = 190;
    const menuHeight = 96;
    const left = Math.min(contextMenu.x, window.innerWidth - menuWidth - 12);
    const top = Math.min(contextMenu.y, window.innerHeight - menuHeight - 12);
    return { left, top };
  }, [contextMenu]);

  React.useEffect(() => {
    if (!contextMenu) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setContextMenu(null);
    };
    const handleScroll = () => setContextMenu(null);
    window.addEventListener("keydown", handleKey);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [contextMenu]);

  return (
    <aside
      className={cn(
        "fixed glass-panel inset-y-0 left-0 z-50 flex w-[82vw] max-w-sm translate-x-[-100%] flex-col gap-6 overflow-y-auto border-r theme-divider  px-5 py-7  transition-transform lg:static lg:z-auto lg:w-80 lg:translate-x-0 ",
        isOpen && "translate-x-0",
        className
      )}
    >
      <div className="flex items-center justify-between lg:hidden">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] theme-text-faint">
            {APP_NAME}
          </p>
          <h1 className="text-xl font-semibold">{APP_TITLE}</h1>
        </div>
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full theme-surface-ghost theme-text-muted"
          aria-label="Close menu"
        >
          ✕
        </button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="hidden lg:block">
          <p className="text-[10px] uppercase tracking-[0.34em] theme-text-faint">
            {APP_NAME}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {APP_TITLE}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full theme-surface-ghost theme-text-muted transition hover:text-[color:var(--foreground)]"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Dialog open={isKeyVaultOpen} onOpenChange={setIsKeyVaultOpen}>
            <DialogTrigger asChild>
              <button className="flex h-10 w-10 items-center justify-center rounded-full theme-surface-ghost theme-text-muted transition hover:text-[color:var(--foreground)]">
                <Settings className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>API Key Vault</DialogTitle>
                <DialogDescription>
                  Store your keys locally for quick access. We only keep them in
                  your browser.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-2 flex items-center gap-2 rounded-xl theme-surface-ghost px-3 py-2 text-xs theme-text-subtle">
                <ShieldCheck className="h-4 w-4 theme-text-success" />
                Keys stay on this device (localStorage). Nothing is sent
                anywhere until you generate.
              </div>
              <div className="mt-5 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm theme-text-muted">OpenAI Key</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type={showKeys.openai ? "text" : "password"}
                      value={draftKeys.openai}
                      onChange={(event) =>
                        setDraftKeys((prev) => ({
                          ...prev,
                          openai: event.target.value,
                        }))
                      }
                      placeholder="sk-..."
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowKeys((prev) => ({
                          ...prev,
                          openai: !prev.openai,
                        }))
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-lg theme-surface-ghost theme-text-subtle"
                    >
                      {showKeys.openai ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {keyErrors.openai ? (
                    <p className="text-xs theme-text-error">{keyErrors.openai}</p>
                  ) : (
                    <p className="text-xs theme-text-faint">
                      Required for GPT Image generation.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm theme-text-muted">Grok API Key</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type={showKeys.xai ? "text" : "password"}
                      value={draftKeys.xai}
                      onChange={(event) =>
                        setDraftKeys((prev) => ({
                          ...prev,
                          xai: event.target.value,
                        }))
                      }
                      placeholder="xai-..."
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowKeys((prev) => ({
                          ...prev,
                          xai: !prev.xai,
                        }))
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-lg theme-surface-ghost theme-text-subtle"
                    >
                      {showKeys.xai ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {keyErrors.xai ? (
                    <p className="text-xs theme-text-error">{keyErrors.xai}</p>
                  ) : (
                    <p className="text-xs theme-text-faint">
                      Enables Grok image generation models.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm theme-text-muted">
                    Google Gemini Key
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type={showKeys.google ? "text" : "password"}
                      value={draftKeys.google}
                      onChange={(event) =>
                        setDraftKeys((prev) => ({
                          ...prev,
                          google: event.target.value,
                        }))
                      }
                      placeholder="AIza..."
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowKeys((prev) => ({
                          ...prev,
                          google: !prev.google,
                        }))
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-lg theme-surface-ghost theme-text-subtle"
                    >
                      {showKeys.google ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {keyErrors.google ? (
                    <p className="text-xs theme-text-error">{keyErrors.google}</p>
                  ) : (
                    <p className="text-xs theme-text-faint">
                      Enables Gemini image generation models.
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
                <Button variant="ghost" onClick={onClearKeys}>
                  <Trash2 className="h-4 w-4" />
                  Clear All
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onSaveKeys}>
                    Save Keys
                  </Button>
                  <DialogClose asChild>
                    <Button variant="ghost">Close</Button>
                  </DialogClose>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className={sidebarSectionClass}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-medium theme-text-muted">
            <MessageSquare className="h-4 w-4" />
            Sessions
          </div>
          <Button variant="outline" size="sm" className="h-8 px-3" onClick={onCreateSession}>
            <Plus className="h-3 w-3" />
            New
          </Button>
        </div>
        <div className={sidebarListClass}>
          {sessions.map((session) => {
            const clusterList = Array.isArray(session.clusters) ? session.clusters : [];
            const promptCount = clusterList.length;
            const lastPrompt =
              clusterList[clusterList.length - 1]?.prompt || "No prompts yet.";
            return (
              <div
                key={session.id}
                role="button"
                tabIndex={0}
                data-active={session.id === activeSessionId}
                onClick={() => onSelectSession(session.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    onSelectSession(session.id);
                  }
                }}
                onContextMenu={(event) => {
                  event.preventDefault();
                  setContextMenu({
                    sessionId: session.id,
                    x: event.clientX,
                    y: event.clientY,
                  });
                }}
                className="theme-session-item group w-full rounded-xl px-3 py-2 text-left"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{session.title}</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] theme-text-faint">
                    {promptCount} {promptCount === 1 ? "prompt" : "prompts"}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="truncate text-xs theme-text-subtle">{lastPrompt}</p>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      const rect = event.currentTarget.getBoundingClientRect();
                      setContextMenu({
                        sessionId: session.id,
                        x: rect.right - 8,
                        y: rect.bottom + 6,
                      });
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-full theme-surface-ghost theme-text-subtle opacity-100 transition md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                    aria-label="Session options"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {contextMenu &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[60]"
            onClick={() => setContextMenu(null)}
            onContextMenu={(event) => {
              event.preventDefault();
              setContextMenu(null);
            }}
          >
            <div
              className="absolute min-w-[180px] overflow-hidden rounded-xl border theme-border theme-overlay-strong p-1 theme-text-primary theme-shadow-strong backdrop-blur-xl"
              style={menuStyle}
            >
              {(() => {
                const session = sessions.find(
                  (item) => item.id === contextMenu.sessionId
                );
                if (!session) return null;
                return (
                  <>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setContextMenu(null);
                        handleStartRename(session);
                      }}
                      className="theme-interactive flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm"
                    >
                      <Pencil className="h-4 w-4" />
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setContextMenu(null);
                        handleDeleteSession(session);
                      }}
                      className="theme-interactive flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </>
                );
              })()}
            </div>
          </div>,
          document.body
        )}

      <Dialog open={Boolean(renameTarget)} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Session</DialogTitle>
            <DialogDescription>Update the session title.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm theme-text-muted">Session name</label>
            <Input
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              placeholder="Session name"
            />
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete session?"
        description={
          deleteTarget
            ? `This will remove "${deleteTarget.title}" and all its prompts.`
            : undefined
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteSession(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className={cn(sidebarSectionClass, "mt-auto w-full")}>
        <div className="flex items-center gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleFx}
            className="h-9 px-4 w-full"
          >
            {fxEnabled ? "Stop snow" : "Let it snow"}
          </Button>
        </div>
      </div>

    </aside>
  );
}
