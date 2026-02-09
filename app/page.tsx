"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Download,
  Eye,
  EyeOff,
  Layers,
  Menu,
  Settings,
  ShieldCheck,
  Trash2,
  Wand2,
  ZoomIn,
  ZoomOut,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Cluster, ImageItem, useApiKeys, useCanvas } from "./providers";

const MODEL_OPTIONS = [
  {
    id: "openai-gpt-image-1",
    label: "OpenAI · GPT Image",
    providerKey: "openai" as const,
    status: "live" as const,
  },
  {
    id: "gemini-2.5-flash-image",
    label: "Google · Gemini 2.5 Flash Image",
    providerKey: "google" as const,
    status: "live" as const,
  },
  {
    id: "gemini-3-pro-image-preview",
    label: "Google · Gemini 3 Pro Image (Preview)",
    providerKey: "google" as const,
    status: "live" as const,
  },
  {
    id: "anthropic-claude-vision",
    label: "Anthropic · Claude Vision (Coming soon)",
    providerKey: "anthropic" as const,
    status: "coming" as const,
  },
  {
    id: "midjourney-v6",
    label: "Midjourney v6 · Replicate (Coming soon)",
    providerKey: "replicate" as const,
    status: "coming" as const,
  },
];

type DraftKeys = {
  openai: string;
  anthropic: string;
  replicate: string;
  google: string;
};

function useAutosizeTextArea(ref: React.RefObject<HTMLTextAreaElement>, value: string) {
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, [ref, value]);
}

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number
) {
  let index = 0;
  const workers = Array.from({ length: Math.max(1, limit) }, async () => {
    while (index < tasks.length) {
      const taskIndex = index;
      index += 1;
      await tasks[taskIndex]();
    }
  });
  await Promise.all(workers);
}

function parseErrorMessage(raw: string) {
  if (!raw) return "Generation failed.";
  const tryParse = (value: string) => {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  };

  const normalize = (value: string) =>
    value.replace(/\\n/g, " ").replace(/\s+/g, " ").trim();

  let message = raw;
  const parsed = tryParse(raw);
  if (parsed && typeof parsed === "object") {
    const maybeError = parsed as {
      error?: { message?: string } | string;
      message?: string;
    };
    if (typeof maybeError.error === "string") {
      const nested = tryParse(maybeError.error);
      if (
        nested &&
        typeof nested === "object" &&
        (nested as { error?: { message?: string } }).error?.message
      ) {
        message = (nested as { error?: { message?: string } }).error?.message || maybeError.error;
      } else {
        message = maybeError.error;
      }
    } else if (maybeError.error && typeof maybeError.error === "object") {
      message = maybeError.error.message || raw;
    } else if (maybeError.message) {
      message = maybeError.message;
    }
  }

  const normalized = normalize(message);
  const retryMatch = normalized.match(/retry in ([\d.]+)s/i);
  const isQuota =
    /RESOURCE_EXHAUSTED/i.test(normalized) || /quota exceeded/i.test(normalized);
  if (isQuota) {
    const retryText = retryMatch ? ` Retry in ${Math.round(Number(retryMatch[1]))}s.` : "";
    return `Gemini quota exceeded. Check billing/limits and try again.${retryText}`;
  }

  let short = normalized;
  const infoIndex = short.toLowerCase().indexOf("for more information");
  if (infoIndex > 0) {
    short = short.slice(0, infoIndex).trim();
  }
  short = short.replace(/\*.+$/g, "").trim();
  if (short.length > 220) {
    short = `${short.slice(0, 220)}...`;
  }
  return short || "Generation failed.";
}

export default function Home() {
  const { keys, setKey } = useApiKeys();
  const { clusters, setClusters } = useCanvas();
  const [model, setModel] = useState<string>(MODEL_OPTIONS[0].id);
  const [count, setCount] = useState<number>(4);
  const MIN_COUNT = 1;
  const MAX_COUNT = 20;
  const [prompt, setPrompt] = useState<string>("A prism city in the midnight nebula");
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewerTarget, setViewerTarget] = useState<ImageItem | null>(null);
  const [viewerZoom, setViewerZoom] = useState(1);
  const [draftKeys, setDraftKeys] = useState<DraftKeys>({
    openai: "",
    anthropic: "",
    replicate: "",
    google: "",
  });
  const [showKeys, setShowKeys] = useState({
    openai: false,
    anthropic: false,
    replicate: false,
    google: false,
  });
  const [keyErrors, setKeyErrors] = useState<Record<keyof DraftKeys, string>>({
    openai: "",
    anthropic: "",
    replicate: "",
    google: "",
  });
  const [viewport, setViewport] = useState({ width: 1200, height: 800 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isKeyVaultOpen, setIsKeyVaultOpen] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  const promptRef = useRef<HTMLTextAreaElement>(null);
  useAutosizeTextArea(promptRef, prompt);

  React.useEffect(() => {
    const update = () =>
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  React.useEffect(() => {
    setDraftKeys({
      openai: keys.openai || "",
      anthropic: keys.anthropic || "",
      replicate: keys.replicate || "",
      google: keys.google || "",
    });
  }, [keys]);

  const validateKey = useCallback(
    (provider: keyof DraftKeys, value: string) => {
      if (!value.trim()) return "";
      if (provider === "openai") {
        return /^sk-/.test(value) && value.length >= 20
          ? ""
          : "OpenAI keys should start with sk- and be at least 20 characters.";
      }
      if (provider === "anthropic") {
        return /^(sk-|ant-)/.test(value) && value.length >= 20
          ? ""
          : "Anthropic keys should start with sk- or ant- and be at least 20 characters.";
      }
      if (provider === "replicate") {
        return /^(r8_|replicate)/.test(value) && value.length >= 10
          ? ""
          : "Replicate tokens typically start with r8_.";
      }
      if (provider === "google") {
        return value.length >= 20
          ? ""
          : "Google API keys are usually 20+ characters.";
      }
      return "";
    },
    []
  );

  const handleSaveKeys = useCallback(() => {
    const nextErrors: Record<keyof DraftKeys, string> = {
      openai: validateKey("openai", draftKeys.openai),
      anthropic: validateKey("anthropic", draftKeys.anthropic),
      replicate: validateKey("replicate", draftKeys.replicate),
      google: validateKey("google", draftKeys.google),
    };
    setKeyErrors(nextErrors);
    const hasError = Object.values(nextErrors).some((msg) => msg.length > 0);
    if (hasError) return;
    setKey("openai", draftKeys.openai.trim());
    setKey("anthropic", draftKeys.anthropic.trim());
    setKey("replicate", draftKeys.replicate.trim());
    setKey("google", draftKeys.google.trim());
  }, [draftKeys, setKey, validateKey]);

  const handleClearKeys = useCallback(() => {
    setDraftKeys({ openai: "", anthropic: "", replicate: "", google: "" });
    setKeyErrors({ openai: "", anthropic: "", replicate: "", google: "" });
    setKey("openai", "");
    setKey("anthropic", "");
    setKey("replicate", "");
    setKey("google", "");
  }, [setKey]);

  const liveModels = useMemo(
    () => MODEL_OPTIONS.filter((option) => option.status === "live"),
    []
  );
  const comingSoonModels = useMemo(
    () => MODEL_OPTIONS.filter((option) => option.status === "coming"),
    []
  );

  const availableModels = useMemo(
    () =>
      liveModels.filter(
        (option) => keys[option.providerKey] && keys[option.providerKey]?.length
      ),
    [keys, liveModels]
  );

  const displayModels = availableModels;
  const hasAnyKey = useMemo(
    () =>
      Object.values(keys).some(
        (value) => typeof value === "string" && value.trim().length > 0
      ),
    [keys]
  );
  const hasSupportedKey = availableModels.length > 0;
  const selectedModelOption = MODEL_OPTIONS.find(
    (option) => option.id === model
  );
  const hasSelectedKey = selectedModelOption
    ? Boolean(keys[selectedModelOption.providerKey])
    : false;
  const selectedApiKey = selectedModelOption
    ? (keys[selectedModelOption.providerKey] ?? "")
    : "";

  const controlBarWidth = Math.min(920, viewport.width * 0.92);

  React.useEffect(() => {
    if (!availableModels.length) return;
    if (availableModels.some((option) => option.id === model)) return;
    setModel(availableModels[0].id);
  }, [availableModels, model]);

  const filteredClusters = useMemo(
    () => [...clusters].sort((a, b) => a.createdAt - b.createdAt),
    [clusters]
  );

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    if (!hasSelectedKey) {
      setIsKeyVaultOpen(true);
      return;
    }
    const clusterId = `cluster-${Date.now()}`;
    const initialCluster: Cluster = {
      id: clusterId,
      prompt,
      model,
      images: Array.from({ length: count }).map((_, index) => ({
        id: `${clusterId}-${index}`,
        src: "",
        alt: `${prompt} image ${index + 1}`,
        status: "loading",
      })),
      x: 0,
      y: 0,
      createdAt: Date.now(),
      status: "loading",
    };

    setClusters((prev) => [...prev, initialCluster]);
    setIsGenerating(true);

    let completed = 0;
    let successCount = 0;
    let firstError = "";

    const updateCluster = (updater: (cluster: Cluster) => Cluster) => {
      setClusters((prev) =>
        prev.map((cluster) =>
          cluster.id === clusterId ? updater(cluster) : cluster
        )
      );
    };

    const markComplete = () => {
      completed += 1;
      if (completed < count) return;
      const status = successCount > 0 ? "ready" : "error";
      const errorMessage =
        successCount > 0 && successCount < count
          ? "Some images failed to generate."
          : firstError || undefined;
      updateCluster((cluster) => ({
        ...cluster,
        status,
        errorMessage,
      }));
      setIsGenerating(false);
    };

    const tasks = Array.from({ length: count }).map((_, index) => async () => {
      try {
        const response = await fetch("/api/generate-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            model,
            apiKey: selectedApiKey,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(parseErrorMessage(errorText));
        }

        const data = (await response.json()) as { image?: ImageItem; error?: string };
        if (!data.image?.src) {
          throw new Error(data.error || "No image returned from the model.");
        }

        successCount += 1;
        updateCluster((cluster) => ({
          ...cluster,
          images: cluster.images.map((image, imageIndex) =>
            imageIndex === index
              ? { ...data.image, status: "ready" }
              : image
          ),
        }));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Generation failed.";
        if (!firstError) firstError = message;
        updateCluster((cluster) => ({
          ...cluster,
          images: cluster.images.map((image, imageIndex) =>
            imageIndex === index
              ? {
                  ...image,
                  status: "error",
                  errorMessage: message,
                }
              : image
          ),
        }));
        console.error(error);
      } finally {
        markComplete();
      }
    });

    void runWithConcurrency(tasks, 2);
  }, [
    count,
    hasSelectedKey,
    model,
    prompt,
    setClusters,
    setIsKeyVaultOpen,
  ]);

  const handleDownload = useCallback(async (image: ImageItem) => {
    const link = document.createElement("a");
    link.href = image.src;
    link.download = `${image.id}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, []);

  const handleOpenViewer = useCallback((image: ImageItem) => {
    setViewerTarget(image);
    setViewerZoom(1);
  }, []);

  const handleResetViewer = useCallback(() => {
    setViewerZoom(1);
  }, []);

  React.useEffect(() => {
    if (!feedRef.current) return;
    const node = feedRef.current;
    const handle = requestAnimationFrame(() => {
      node.scrollTop = node.scrollHeight;
    });
    return () => cancelAnimationFrame(handle);
  }, [filteredClusters.length, isGenerating]);

  const sidebarSectionClass =
    "space-y-3 rounded-2xl border border-white/10 bg-white/6 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.28)]";

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden text-white">
      <div className="pointer-events-none absolute inset-0 canvas-grid opacity-60" />
      <div className="relative z-10 flex h-full flex-col lg:flex-row">
        <div className="flex items-center justify-between border-b border-white/5 bg-black/50 px-5 py-4 backdrop-blur-2xl lg:hidden">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
              VisionGrid
            </p>
            <h1 className="text-lg font-semibold text-white">Midnight Nebula</h1>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/60 opacity-0 pointer-events-none transition lg:hidden",
            isSidebarOpen && "pointer-events-auto opacity-100"
          )}
          onClick={() => setIsSidebarOpen(false)}
        />

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-[82vw] max-w-sm translate-x-[-100%] flex-col gap-7 overflow-y-auto border-r border-white/10 bg-black/80 px-6 py-8 backdrop-blur-2xl transition-transform lg:static lg:z-auto lg:w-80 lg:translate-x-0 lg:border-b-0 lg:border-r lg:bg-black/60",
            isSidebarOpen && "translate-x-0"
          )}
        >
          <div className="flex items-center justify-between lg:hidden">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                VisionGrid
              </p>
              <h1 className="text-xl font-semibold text-white">
                Midnight Nebula
              </h1>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="hidden lg:block">
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                VisionGrid
              </p>
              <h1 className="text-2xl font-semibold text-white">
                Midnight Nebula
              </h1>
            </div>
            <Dialog open={isKeyVaultOpen} onOpenChange={setIsKeyVaultOpen}>
              <DialogTrigger asChild>
                <button className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:text-white">
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
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  Keys stay on this device (localStorage). Nothing is sent
                  anywhere until you generate.
                </div>
                <div className="mt-5 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-white/70">OpenAI Key</label>
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
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60"
                      >
                        {showKeys.openai ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {keyErrors.openai ? (
                      <p className="text-xs text-rose-300">{keyErrors.openai}</p>
                    ) : (
                      <p className="text-xs text-white/40">
                        Required for GPT Image generation.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-white/70">Anthropic Key</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type={showKeys.anthropic ? "text" : "password"}
                        value={draftKeys.anthropic}
                        onChange={(event) =>
                          setDraftKeys((prev) => ({
                            ...prev,
                            anthropic: event.target.value,
                          }))
                        }
                        placeholder="sk-ant-..."
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowKeys((prev) => ({
                            ...prev,
                            anthropic: !prev.anthropic,
                          }))
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60"
                      >
                        {showKeys.anthropic ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {keyErrors.anthropic ? (
                      <p className="text-xs text-rose-300">
                        {keyErrors.anthropic}
                      </p>
                    ) : (
                      <p className="text-xs text-white/40">
                        Enables Claude vision workflows.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-white/70">Replicate Key</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type={showKeys.replicate ? "text" : "password"}
                        value={draftKeys.replicate}
                        onChange={(event) =>
                          setDraftKeys((prev) => ({
                            ...prev,
                            replicate: event.target.value,
                          }))
                        }
                        placeholder="r8_..."
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowKeys((prev) => ({
                            ...prev,
                            replicate: !prev.replicate,
                          }))
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60"
                      >
                        {showKeys.replicate ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {keyErrors.replicate ? (
                      <p className="text-xs text-rose-300">
                        {keyErrors.replicate}
                      </p>
                    ) : (
                      <p className="text-xs text-white/40">
                        Used for Midjourney/Replicate integrations.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-white/70">
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
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60"
                      >
                        {showKeys.google ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {keyErrors.google ? (
                      <p className="text-xs text-rose-300">
                        {keyErrors.google}
                      </p>
                    ) : (
                      <p className="text-xs text-white/40">
                        Enables Gemini image generation models.
                      </p>
                    )}
                  </div>
                </div>
                <DialogFooter className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
                  <Button variant="ghost" onClick={handleClearKeys}>
                    <Trash2 className="h-4 w-4" />
                    Clear All
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSaveKeys}>
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

          <div className={sidebarSectionClass}>
            <div className="flex items-center gap-2 text-sm font-medium text-white/70">
              <Layers className="h-4 w-4" />
              Active Models
            </div>
            {hasSupportedKey ? (
              <Select value={model} onValueChange={setModel}>
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
                className="flex h-11 w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white/50"
              >
                {hasAnyKey ? "Add supported API key" : "Add API keys"}
                <span className="text-white/30">›</span>
              </button>
            )}
            <p className="text-xs text-white/45">
              {hasSupportedKey
                ? "Models are filtered by active keys."
                : hasAnyKey
                  ? "Only OpenAI and Gemini image models are live right now."
                  : "Add API keys in the vault to unlock models."}
            </p>
          </div>

        </aside>

        <main className="relative flex-1 overflow-hidden">
          <div
            ref={feedRef}
            className="absolute inset-x-0 bottom-32 top-8 overflow-y-auto px-6 pb-10 md:bottom-36 md:top-10"
          >
            <div className="mx-auto flex w-full max-w-[980px] flex-col gap-8">
              {filteredClusters.length === 0 && (
                <div className="glass-panel rounded-3xl p-6">
                  <p className="text-sm text-white/70">
                    Add your API keys to unlock image generation, then craft a
                    prompt below.
                  </p>
                  <p className="mt-2 text-xs text-white/45">
                    Your keys stay in this browser and can be removed anytime.
                  </p>
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsKeyVaultOpen(true)}
                    >
                      Open Key Vault
                    </Button>
                  </div>
                </div>
              )}
              <AnimatePresence>
                {filteredClusters.map((cluster) => {
                  const images = cluster.images ?? [];
                  const completedCount = images.filter(
                    (image) => image.status && image.status !== "loading"
                  ).length;
                  const hasAnyErrors = images.some(
                    (image) => image.status === "error"
                  );
                  return (
                    <motion.div
                      key={cluster.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="glass-panel rounded-3xl p-5"
                    >
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                            Prompt
                          </p>
                          <p className="mt-2 text-lg font-semibold text-white">
                            {cluster.prompt}
                          </p>
                          <p className="mt-1 text-xs text-white/50">
                            {cluster.model}
                          </p>
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/60">
                          {cluster.status === "loading"
                            ? `Generating ${completedCount}/${images.length}`
                            : cluster.status === "error"
                              ? "Error"
                              : "Ready"}
                        </span>
                      </div>
                      {cluster.status === "error" && (
                        <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
                          {cluster.errorMessage ||
                            "Generation failed. Please check your API key or quota."}
                        </div>
                      )}
                      {cluster.status === "ready" && hasAnyErrors && (
                        <div className="mb-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
                          {cluster.errorMessage || "Some images failed to generate."}
                        </div>
                      )}
                      {images.length > 0 && (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                          {images.map((image, index) => (
                            <div
                              key={image.id}
                              onClick={() => image.src && handleOpenViewer(image)}
                              className={cn(
                                "group relative aspect-square w-full overflow-hidden rounded-2xl border border-white/10",
                                cluster.status === "loading" && "shimmer",
                                image.src && "cursor-zoom-in"
                              )}
                            >
                              {image.status === "error" ? (
                                <div className="flex h-full w-full items-center justify-center bg-rose-500/15 text-xs text-rose-200">
                                  Failed
                                </div>
                              ) : image.status === "loading" ? (
                                <div className="h-full w-full bg-white/5" />
                              ) : (
                                <img
                                  src={image.src}
                                  alt={image.alt}
                                  className="h-full w-full object-cover"
                                />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/10" />
                              <span className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-1 text-[10px] text-white/60">
                                {index + 1}
                              </span>
                              {image.src && (
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleDownload(image);
                                  }}
                                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white/80 opacity-0 transition group-hover:opacity-100"
                                  aria-label="Download image"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4 md:bottom-6">
            <div
              className="pointer-events-auto flex w-full flex-col items-stretch gap-3 rounded-3xl border border-white/10 bg-black/60 px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:flex-row md:items-center"
              style={{ maxWidth: controlBarWidth }}
            >
              {!hasSupportedKey ? (
                <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/80">
                      {hasAnyKey
                        ? "Add a supported API key to start generating."
                        : "Add an API key to start generating."}
                    </p>
                    <p className="text-xs text-white/45">
                      Open the vault to connect OpenAI or Gemini.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setIsKeyVaultOpen(true)}
                    className="h-11 px-6"
                  >
                    Open Key Vault
                  </Button>
                </div>
              ) : (
                <>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger className="h-11 w-full md:w-[220px]">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {displayModels.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex h-11 items-center justify-between gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm md:justify-start">
                    <button
                      onClick={() => setCount((prev) => Math.max(MIN_COUNT, prev - 1))}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white"
                    >
                      -
                    </button>
                    <span className="w-6 text-center text-sm text-white/80">
                      {count}
                    </span>
                    <button
                      onClick={() => setCount((prev) => Math.min(MAX_COUNT, prev + 1))}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white"
                    >
                      +
                    </button>
                  </div>

                  <Textarea
                    ref={promptRef}
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    className="max-h-28 flex-1 resize-none md:min-w-[260px]"
                    placeholder="Describe the image you want to create..."
                  />

                  <Button
                    onClick={handleGenerate}
                    className={cn(
                      "pulse-glow h-11 px-6",
                      isGenerating && "opacity-70"
                    )}
                    disabled={isGenerating}
                  >
                    <Wand2 className="h-4 w-4" />
                    Generate
                  </Button>
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      <Dialog open={!!viewerTarget} onOpenChange={() => setViewerTarget(null)}>
        <DialogContent className="w-[min(92vw,1100px)] max-w-none">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
            <DialogDescription>
              Scroll to pan and use the zoom controls for detail.
            </DialogDescription>
          </DialogHeader>
          {viewerTarget && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setViewerZoom((prev) => Math.max(0.6, prev - 0.2))
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <Slider
                  value={[viewerZoom]}
                  min={0.6}
                  max={2.5}
                  step={0.1}
                  onValueChange={(value) => setViewerZoom(value[0])}
                />
                <button
                  onClick={() =>
                    setViewerZoom((prev) => Math.min(2.5, prev + 0.2))
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <Button variant="ghost" onClick={handleResetViewer}>
                  Reset
                </Button>
              </div>
              <div className="max-h-[70vh] overflow-auto rounded-2xl border border-white/10 bg-black/40 p-2">
                <div
                  className="inline-block origin-top-left"
                  style={{ transform: `scale(${viewerZoom})` }}
                >
                  <img
                    src={viewerTarget.src}
                    alt={viewerTarget.alt}
                    className="h-auto max-w-none rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="ghost">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
