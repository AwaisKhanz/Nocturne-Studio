"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";

import { ApiKeys, Cluster, ImageItem, useApiKeys, useCanvas } from "./providers";
import { BackgroundFx, BackgroundFxMode } from "./background-fx";
import { MobileHeader } from "./components/MobileHeader";
import { Sidebar } from "./components/Sidebar";
import { ClusterFeed } from "./components/ClusterFeed";
import { ControlBar } from "./components/ControlBar";
import { ImageViewer } from "./components/ImageViewer";
import { IntroOverlay } from "./components/IntroOverlay";

type ModelOption = {
  id: string;
  label: string;
  providerKey: keyof ApiKeys;
  status: "live" | "coming";
  requires?: (keyof ApiKeys)[];
};

const MODEL_OPTIONS: ModelOption[] = [
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
    id: "grok-imagine-image",
    label: "xAI · Grok Imagine",
    providerKey: "xai" as const,
    status: "live" as const,
  },
];

type DraftKeys = {
  openai: string;
  google: string;
  xai: string;
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
      error?: { message?: string; detail?: string } | string;
      message?: string;
      detail?: string;
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
      message = maybeError.error.message || maybeError.error.detail || raw;
    } else if (maybeError.message) {
      message = maybeError.message;
    } else if (maybeError.detail) {
      message = maybeError.detail;
    }
  }

  const normalized = normalize(message);
  const retryMatch = normalized.match(/retry in ([\d.]+)s/i);
  const isQuota =
    /RESOURCE_EXHAUSTED/i.test(normalized) || /quota exceeded/i.test(normalized);
  if (isQuota) {
    const retryText = retryMatch ? ` Retry in ${Math.round(Number(retryMatch[1]))}s.` : "";
    return `Quota exceeded. Check billing/limits and try again.${retryText}`;
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
  const [draftKeys, setDraftKeys] = useState<DraftKeys>({
    openai: "",
    google: "",
    xai: "",
  });
  const [showKeys, setShowKeys] = useState({
    openai: false,
    google: false,
    xai: false,
  });
  const [keyErrors, setKeyErrors] = useState<Record<keyof DraftKeys, string>>({
    openai: "",
    google: "",
    xai: "",
  });
  const [viewport, setViewport] = useState({ width: 1200, height: 800 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isKeyVaultOpen, setIsKeyVaultOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [fxEnabled, setFxEnabled] = useState(true);
  const [fxMode, setFxMode] = useState<BackgroundFxMode>("snow");
  const [showIntro, setShowIntro] = useState(true);
  const feedRef = useRef<HTMLDivElement>(null);

  // Sync theme state with DOM after hydration
  React.useEffect(() => {
    const attr = document.documentElement.dataset.theme;
    if (attr === "light" || attr === "dark") {
      setTheme(attr);
    }
  }, []);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowIntro(false);
    }, 1800);
    return () => window.clearTimeout(timer);
  }, []);

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

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        document.documentElement.dataset.theme = next;
        localStorage.setItem("visiongrid.theme", next);
      }
      return next;
    });
  }, []);

  React.useEffect(() => {
    setDraftKeys({
      openai: keys.openai || "",
      google: keys.google || "",
      xai: keys.xai || "",
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
      if (provider === "google") {
        return value.length >= 20
          ? ""
          : "Google API keys are usually 20+ characters.";
      }
      if (provider === "xai") {
        return value.length >= 20
          ? ""
          : "xAI API keys are usually 20+ characters.";
      }
      return "";
    },
    []
  );

  const handleSaveKeys = useCallback(() => {
    const nextErrors: Record<keyof DraftKeys, string> = {
      openai: validateKey("openai", draftKeys.openai),
      google: validateKey("google", draftKeys.google),
      xai: validateKey("xai", draftKeys.xai),
    };
    setKeyErrors(nextErrors);
    const hasError = Object.values(nextErrors).some((msg) => msg.length > 0);
    if (hasError) return;
    setKey("openai", draftKeys.openai.trim());
    setKey("google", draftKeys.google.trim());
    setKey("xai", draftKeys.xai.trim());
  }, [draftKeys, setKey, validateKey]);

  const handleClearKeys = useCallback(() => {
    setDraftKeys({
      openai: "",
      google: "",
      xai: "",
    });
    setKeyErrors({
      openai: "",
      google: "",
      xai: "",
    });
    setKey("openai", "");
    setKey("google", "");
    setKey("xai", "");
  }, [setKey]);

  const liveModels = useMemo(
    () => MODEL_OPTIONS.filter((option) => option.status === "live"),
    []
  );
  const comingSoonModels = useMemo(
    () => MODEL_OPTIONS.filter((option) => option.status === "coming"),
    []
  );

  const hasKeyValue = useCallback(
    (value?: string) => Boolean(value && value.trim().length > 0),
    []
  );

  const availableModels = useMemo(
    () =>
      liveModels.filter((option) => {
        if (!hasKeyValue(keys[option.providerKey])) return false;
        if (!option.requires?.length) return true;
        return option.requires.every((key) => hasKeyValue(keys[key]));
      }),
    [hasKeyValue, keys, liveModels]
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
    ? [selectedModelOption.providerKey, ...(selectedModelOption.requires ?? [])].every(
        (key) => hasKeyValue(keys[key])
      )
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

    void runWithConcurrency(tasks, count);
  }, [
    count,
    hasSelectedKey,
    model,
    prompt,
    setClusters,
    setIsKeyVaultOpen,
    selectedApiKey,
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
  }, []);

  React.useEffect(() => {
    if (!feedRef.current) return;
    const node = feedRef.current;
    const handle = requestAnimationFrame(() => {
      node.scrollTop = node.scrollHeight;
    });
    return () => cancelAnimationFrame(handle);
  }, [filteredClusters.length, isGenerating]);

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden theme-text-primary">
      <IntroOverlay
        isVisible={showIntro}
        onComplete={() => setShowIntro(false)}
        onSkip={() => setShowIntro(false)}
      />
      <div className="pointer-events-none absolute inset-0">
        <BackgroundFx active={fxEnabled} mode={fxMode} theme={theme} />
      </div>
      <div className="pointer-events-none absolute inset-0 canvas-grid opacity-60" />
      <div className="relative z-10 flex h-full flex-col lg:flex-row">
        <MobileHeader
          theme={theme}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onToggleTheme={toggleTheme}
        />

        <div
          className={`fixed inset-0 z-40 theme-overlay opacity-0 pointer-events-none transition lg:hidden ${
            isSidebarOpen ? "pointer-events-auto opacity-100" : ""
          }`}
          onClick={() => setIsSidebarOpen(false)}
        />

        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          theme={theme}
          onToggleTheme={toggleTheme}
          isKeyVaultOpen={isKeyVaultOpen}
          setIsKeyVaultOpen={setIsKeyVaultOpen}
          draftKeys={draftKeys}
          setDraftKeys={setDraftKeys}
          showKeys={showKeys}
          setShowKeys={setShowKeys}
          keyErrors={keyErrors}
          onSaveKeys={handleSaveKeys}
          onClearKeys={handleClearKeys}
          hasSupportedKey={hasSupportedKey}
          hasAnyKey={hasAnyKey}
          model={model}
          onModelChange={setModel}
          displayModels={displayModels}
          comingSoonModels={comingSoonModels}
          fxEnabled={fxEnabled}
          onToggleFx={() => setFxEnabled((prev) => !prev)}
          fxMode={fxMode}
          onFxModeChange={setFxMode}
        />

        <main className="relative flex-1 overflow-hidden">
          <ClusterFeed
            clusters={filteredClusters}
            isGenerating={isGenerating}
            onOpenViewer={handleOpenViewer}
            onDownload={handleDownload}
            onOpenVault={() => setIsKeyVaultOpen(true)}
            hasSupportedKey={hasSupportedKey}
            hasAnyKey={hasAnyKey}
            feedRef={feedRef}
          />

          <ControlBar
            hasSupportedKey={hasSupportedKey}
            hasAnyKey={hasAnyKey}
            onOpenVault={() => setIsKeyVaultOpen(true)}
            model={model}
            onModelChange={setModel}
            models={displayModels}
            count={count}
            minCount={MIN_COUNT}
            maxCount={MAX_COUNT}
            onDecrement={() => setCount((prev) => Math.max(MIN_COUNT, prev - 1))}
            onIncrement={() => setCount((prev) => Math.min(MAX_COUNT, prev + 1))}
            prompt={prompt}
            onPromptChange={setPrompt}
            promptRef={promptRef}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            maxWidth={controlBarWidth}
          />
        </main>

        <ImageViewer image={viewerTarget} onClose={() => setViewerTarget(null)} />
      </div>
    </div>
  );
}
