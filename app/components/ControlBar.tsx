"use client";

import { Minus, Sparkles, Stars, Wand2, Zap, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ApiKeys } from "@/app/providers";

export type ModelOption = {
  id: string;
  label: string;
  providerKey: keyof ApiKeys;
  status: "live" | "coming";
  requires?: (keyof ApiKeys)[];
};

export function ControlBar({
  hasSupportedKey,
  hasAnyKey,
  onOpenVault,
  model,
  onModelChange,
  models,
  count,
  minCount,
  maxCount,
  onDecrement,
  onIncrement,
  prompt,
  onPromptChange,
  promptRef,
  onGenerate,
  isGenerating,
  maxWidth,
}: {
  hasSupportedKey: boolean;
  hasAnyKey: boolean;
  onOpenVault: () => void;
  model: string;
  onModelChange: (value: string) => void;
  models: ModelOption[];
  count: number;
  minCount: number;
  maxCount: number;
  onDecrement: () => void;
  onIncrement: () => void;
  prompt: string;
  onPromptChange: (value: string) => void;
  promptRef: React.RefObject<HTMLTextAreaElement | null>;
  onGenerate: () => void;
  isGenerating: boolean;
  maxWidth: number;
}) {
  const modelIcons: Record<string, React.ReactNode> = {
    "openai-gpt-image-1": <Sparkles className="h-4 w-4" />,
    "gemini-2.5-flash-image": <Stars className="h-4 w-4" />,
    "grok-imagine-image": <Zap className="h-4 w-4" />,
  };

  const selectedModel = models.find((m) => m.id === model);

  return (
    <div className="pointer-events-none  absolute inset-x-0 bottom-4 flex justify-center px-4 md:bottom-6">
      <div
        className="pointer-events-auto glass-panel flex w-full flex-col gap-4 rounded-2xl border theme-border theme-overlay px-5 py-4 "
        style={{ maxWidth }}
      >
        {!hasSupportedKey ? (
          <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium theme-text-muted">
                {hasAnyKey
                  ? "Add a supported API key to start generating."
                  : "Add an API key to start generating."}
              </p>
              <p className="text-xs theme-text-subtle">
                Open the vault to connect OpenAI, Gemini, or Grok.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={onOpenVault}
              size="sm"
              className="h-10 px-5"
            >
              Open Key Vault
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-2.5">
            {/* Top row on mobile: Model selector and quantity controls */}
            <div className="flex items-center gap-2.5">
              {/* Compact Model Selector - Icon Only */}
              <Select value={model} onValueChange={onModelChange}>
                <SelectTrigger className="h-12 w-12 px-0 justify-center border-0 theme-surface-ghost shrink-0">
                  <SelectValue>
                    <div className="flex items-center justify-center">
                      {selectedModel && modelIcons[selectedModel.id]}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {models.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      <div className="flex items-center gap-2.5">
                        {modelIcons[option.id] ?? <Sparkles className="h-4 w-4" />}
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Compact Quantity Controls */}
              <div className="flex items-center gap-1 rounded-lg theme-surface-ghost px-2 h-12 shrink-0">
                <button
                  onClick={onDecrement}
                  disabled={count <= minCount}
                  className="flex h-7 w-7 items-center justify-center rounded-md theme-text-muted transition hover:theme-text-primary hover:bg-[color:var(--surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-[1.5rem] text-center text-sm font-semibold theme-text-primary">
                  {count}
                </span>
                <button
                  onClick={onIncrement}
                  disabled={count >= maxCount}
                  className="flex h-7 w-7 items-center justify-center rounded-md theme-text-muted transition hover:theme-text-primary hover:bg-[color:var(--surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Bottom row on mobile: Prompt input and Generate button */}
            <div className="flex items-start gap-2.5 flex-1 w-full sm:w-auto">
              {/* Prompt Input */}
              <Textarea
                ref={promptRef}
                value={prompt}
                onChange={(event) => onPromptChange(event.target.value)}
                className="min-h-[48px] h-12 max-h-32 flex-1 resize-none text-sm py-3"
                placeholder="Describe the image you want to create..."
              />

              {/* Generate Button */}
              <Button
                onClick={onGenerate}
                className={cn("pulse-glow h-12 px-6 font-semibold shrink-0", isGenerating && "opacity-70")}
                size="default"
                disabled={isGenerating}
              >
                <Wand2 className="h-4 w-4" />
                Generate
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
