"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ApiKeys = {
  openai?: string;
  anthropic?: string;
  midjourney?: string;
  replicate?: string;
  google?: string;
};

export type ImageItem = {
  id: string;
  src: string;
  alt: string;
  status?: "loading" | "ready" | "error";
  errorMessage?: string;
};

export type Cluster = {
  id: string;
  prompt: string;
  model: string;
  images: ImageItem[];
  x: number;
  y: number;
  createdAt: number;
  status: "loading" | "ready" | "error";
  errorMessage?: string;
};

type ApiKeysContextValue = {
  keys: ApiKeys;
  setKey: (provider: keyof ApiKeys, value: string) => void;
};

type CanvasContextValue = {
  clusters: Cluster[];
  setClusters: React.Dispatch<React.SetStateAction<Cluster[]>>;
};

const ApiKeysContext = createContext<ApiKeysContextValue | null>(null);
const CanvasContext = createContext<CanvasContextValue | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [keys, setKeys] = useState<ApiKeys>({});
  const [clusters, setClusters] = useState<Cluster[]>([]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("visiongrid.apiKeys");
      if (raw) {
        setKeys(JSON.parse(raw) as ApiKeys);
      }
    } catch {
      setKeys({});
    }
  }, []);

  const setKey = useCallback((provider: keyof ApiKeys, value: string) => {
    setKeys((prev) => {
      const next = { ...prev, [provider]: value };
      if (typeof window !== "undefined") {
        localStorage.setItem("visiongrid.apiKeys", JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const apiValue = useMemo(() => ({ keys, setKey }), [keys, setKey]);
  const canvasValue = useMemo(
    () => ({ clusters, setClusters }),
    [clusters]
  );

  return (
    <ApiKeysContext.Provider value={apiValue}>
      <CanvasContext.Provider value={canvasValue}>
        {children}
      </CanvasContext.Provider>
    </ApiKeysContext.Provider>
  );
}

export function useApiKeys() {
  const ctx = useContext(ApiKeysContext);
  if (!ctx) throw new Error("useApiKeys must be used within Providers");
  return ctx;
}

export function useCanvas() {
  const ctx = useContext(CanvasContext);
  if (!ctx) throw new Error("useCanvas must be used within Providers");
  return ctx;
}
