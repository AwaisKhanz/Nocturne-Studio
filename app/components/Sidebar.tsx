"use client";

import { Eye, EyeOff, Layers, Moon, Settings, ShieldCheck, Sun, Trash2 } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ApiKeys } from "@/app/providers";
import type { BackgroundFxMode } from "@/app/background-fx";

type DraftKeys = {
  openai: string;
  google: string;
  xai: string;
};

type ModelOption = {
  id: string;
  label: string;
  providerKey: keyof ApiKeys;
  status: "live" | "coming";
  requires?: (keyof ApiKeys)[];
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
  hasSupportedKey,
  hasAnyKey,
  model,
  onModelChange,
  displayModels,
  comingSoonModels,
  fxEnabled,
  onToggleFx,
  fxMode,
  onFxModeChange,
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
  hasSupportedKey: boolean;
  hasAnyKey: boolean;
  model: string;
  onModelChange: (value: string) => void;
  displayModels: ModelOption[];
  comingSoonModels: ModelOption[];
  fxEnabled: boolean;
  onToggleFx: () => void;
  fxMode: BackgroundFxMode;
  onFxModeChange: (value: BackgroundFxMode) => void;
}) {
  const sidebarSectionClass =
    "space-y-3 rounded-2xl border theme-border theme-surface theme-shadow-soft p-4 theme-card-hover";

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-[82vw] max-w-sm translate-x-[-100%] flex-col gap-6 overflow-y-auto border-r theme-divider theme-sidebar px-5 py-7 backdrop-blur-lg transition-transform lg:static lg:z-auto lg:w-80 lg:translate-x-0 theme-edge-shadow",
        isOpen && "translate-x-0",
        className
      )}
    >
      <div className="flex items-center justify-between lg:hidden">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] theme-text-faint">
            VisionGrid
          </p>
          <h1 className="text-xl font-semibold">Midnight Nebula</h1>
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
            VisionGrid
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Midnight Nebula
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
        <div className="flex items-center gap-2 text-sm font-medium theme-text-muted">
          <Layers className="h-4 w-4" />
          Active Models
        </div>
        {hasSupportedKey ? (
          <Select value={model} onValueChange={onModelChange}>
            <SelectTrigger className="h-11 w-full">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {displayModels.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
              {comingSoonModels.length > 0 && <SelectSeparator />}
              {comingSoonModels.map((option) => (
                <SelectItem key={option.id} value={option.id} disabled>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <button
            type="button"
            onClick={() => setIsKeyVaultOpen(true)}
            className="flex h-11 w-full items-center justify-between rounded-lg theme-surface-ghost px-3 text-sm theme-text-subtle"
          >
            {hasAnyKey ? "Add supported API key" : "Add API keys"}
            <span className="theme-text-faint">›</span>
          </button>
        )}
        <p className="text-xs theme-text-subtle">
          {hasSupportedKey
            ? "Models are filtered by active keys."
            : hasAnyKey
              ? "Add the missing keys to unlock models."
              : "Add API keys in the vault to unlock models."}
        </p>
      </div>

      <div className={sidebarSectionClass}>
        <div className="flex items-center gap-2 text-sm font-medium theme-text-muted">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundImage: "var(--accent-gradient)" }}
          />
          Background FX
        </div>
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleFx}
            className="h-9 px-4"
          >
            {fxEnabled ? "Pause" : "Play"}
          </Button>
          <Select
            value={fxMode}
            onValueChange={(value) => onFxModeChange(value as BackgroundFxMode)}
          >
            <SelectTrigger className="h-9 w-full max-w-[160px]">
              <SelectValue placeholder="Effect" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="snow">Snow Drift</SelectItem>
              <SelectItem value="ember">Ember Glow</SelectItem>
              <SelectItem value="stars">Starfield</SelectItem>
              <SelectItem value="rain">Rainfall</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs theme-text-subtle">
          Toggle the ambient animation for a more immersive canvas.
        </p>
      </div>
    </aside>
  );
}
