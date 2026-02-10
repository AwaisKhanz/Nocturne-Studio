"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ApiKeys = {
  openai?: string;
  google?: string;
  xai?: string;
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

export type Session = {
  id: string;
  title: string;
  createdAt: number;
  clusters: Cluster[];
};

type ApiKeysContextValue = {
  keys: ApiKeys;
  setKey: (provider: keyof ApiKeys, value: string) => void;
};

type CanvasContextValue = {
  sessions: Session[];
  activeSessionId: string;
  activeSession?: Session;
  setActiveSessionId: (id: string) => void;
  createSession: (clusters?: Cluster[]) => string;
  updateSession: (id: string, updater: (session: Session) => Session) => void;
  renameSession: (id: string, title: string) => void;
  deleteSession: (id: string) => void;
};

const ApiKeysContext = createContext<ApiKeysContextValue | null>(null);
const CanvasContext = createContext<CanvasContextValue | null>(null);

const SESSION_STORAGE_KEY = "visiongrid.sessions";
const ACTIVE_SESSION_KEY = "visiongrid.activeSessionId";

export function Providers({ children }: { children: React.ReactNode }) {
  const [keys, setKeys] = useState<ApiKeys>({});
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("visiongrid.apiKeys");
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        setKeys({
          openai: typeof parsed.openai === "string" ? parsed.openai : "",
          google: typeof parsed.google === "string" ? parsed.google : "",
          xai: typeof parsed.xai === "string" ? parsed.xai : "",
        });
      }
    } catch {
      setKeys({});
    }
  }, []);

  React.useEffect(() => {
    try {
      const storedSessions = localStorage.getItem(SESSION_STORAGE_KEY);
      const storedActive = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (storedSessions) {
        const parsed = JSON.parse(storedSessions) as Session[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = parsed
            .map((session, index) => ({
              id: typeof session.id === "string" ? session.id : `session-${Date.now()}-${index}`,
              title: typeof session.title === "string" ? session.title : `Session ${index + 1}`,
              createdAt:
                typeof session.createdAt === "number" ? session.createdAt : Date.now(),
              clusters: Array.isArray(session.clusters) ? session.clusters : [],
            }))
            .filter((session) => Boolean(session.id));
          if (normalized.length > 0) {
            setSessions(normalized);
            if (
              storedActive &&
              normalized.some((session) => session.id === storedActive)
            ) {
              setActiveSessionId(storedActive);
            } else {
              setActiveSessionId(normalized[0].id);
            }
            return;
          }
        }
      }
      const id = `session-${Date.now()}`;
      const seed: Session = {
        id,
        title: "Session 1",
        createdAt: Date.now(),
        clusters: [],
      };
      setSessions([seed]);
      setActiveSessionId(id);
    } catch {
      const id = `session-${Date.now()}`;
      setSessions([
        {
          id,
          title: "Session 1",
          createdAt: Date.now(),
          clusters: [],
        },
      ]);
      setActiveSessionId(id);
    }
  }, []);

  React.useEffect(() => {
    if (sessions.length === 0) return;
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
      if (activeSessionId) {
        localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId);
      }
    } catch {
      // ignore
    }
  }, [sessions, activeSessionId]);

  React.useEffect(() => {
    if (sessions.length === 0) return;
    if (sessions.some((session) => session.id === activeSessionId)) return;
    setActiveSessionId(sessions[0].id);
  }, [sessions, activeSessionId]);

  const setKey = useCallback((provider: keyof ApiKeys, value: string) => {
    setKeys((prev) => {
      const next = { ...prev, [provider]: value };
      if (typeof window !== "undefined") {
        localStorage.setItem("visiongrid.apiKeys", JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const createSession = useCallback((clusters: Cluster[] = []) => {
    const id = `session-${Date.now()}`;
    setSessions((prev) => {
      const title = `Session ${prev.length + 1}`;
      return [
        ...prev,
        {
          id,
          title,
          createdAt: Date.now(),
          clusters,
        },
      ];
    });
    setActiveSessionId(id);
    return id;
  }, []);

  const updateSession = useCallback(
    (id: string, updater: (session: Session) => Session) => {
      setSessions((prev) =>
        prev.map((session) => (session.id === id ? updater(session) : session))
      );
    },
    []
  );

  const renameSession = useCallback((id: string, title: string) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === id ? { ...session, title } : session
      )
    );
  }, []);

  const deleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => {
        const next = prev.filter((session) => session.id !== id);
        if (next.length === 0) {
          const fallbackId = `session-${Date.now()}`;
          const fallback: Session = {
            id: fallbackId,
            title: "Session 1",
            createdAt: Date.now(),
            clusters: [],
          };
          setActiveSessionId(fallbackId);
          return [fallback];
        }
        if (id === activeSessionId) {
          setActiveSessionId(next[0].id);
        }
        return next;
      });
    },
    [activeSessionId]
  );

  const apiValue = useMemo(() => ({ keys, setKey }), [keys, setKey]);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId),
    [sessions, activeSessionId]
  );

  const canvasValue = useMemo(
    () => ({
      sessions,
      activeSessionId,
      activeSession,
      setActiveSessionId,
      createSession,
      updateSession,
      renameSession,
      deleteSession,
    }),
    [
      sessions,
      activeSessionId,
      activeSession,
      createSession,
      updateSession,
      renameSession,
      deleteSession,
    ]
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
