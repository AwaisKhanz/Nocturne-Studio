"use client";

import { Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
  promptRef: React.RefObject<HTMLTextAreaElement>;
  onGenerate: () => void;
  isGenerating: boolean;
  maxWidth: number;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4 md:bottom-6">
      <div
        className="pointer-events-auto flex w-full flex-col items-stretch gap-2 rounded-2xl border theme-border theme-overlay px-3 py-2 theme-shadow-strong backdrop-blur-2xl md:flex-row md:items-center"
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
          <>
            <Select value={model} onValueChange={onModelChange}>
              <SelectTrigger className="h-10 w-full md:w-[200px]">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex h-10 items-center justify-between gap-2 rounded-xl theme-surface-ghost px-2 py-1 text-sm md:justify-start">
              <button
                onClick={onDecrement}
                className="flex h-7 w-7 items-center justify-center rounded-lg theme-surface-ghost theme-text-primary"
              >
                -
              </button>
              <span className="w-6 text-center text-sm theme-text-muted">
                {count}
              </span>
              <button
                onClick={onIncrement}
                className="flex h-7 w-7 items-center justify-center rounded-lg theme-surface-ghost theme-text-primary"
              >
                +
              </button>
            </div>

            <Textarea
              ref={promptRef}
              value={prompt}
              onChange={(event) => onPromptChange(event.target.value)}
              className="min-h-[40px] h-10 max-h-24 flex-1 resize-none md:min-w-[260px]"
              placeholder="Describe the image you want to create..."
            />

            <Button
              onClick={onGenerate}
              className={cn("pulse-glow h-10 px-5", isGenerating && "opacity-70")}
              size="sm"
              disabled={isGenerating}
            >
              <Wand2 className="h-4 w-4" />
              Generate
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
