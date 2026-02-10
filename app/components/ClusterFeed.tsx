"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Download, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Cluster, ImageItem } from "@/app/providers";

export function ClusterFeed({
  clusters,
  isGenerating,
  onOpenViewer,
  onDownload,
  onDeleteCluster,
  onOpenVault,
  hasSupportedKey,
  hasAnyKey,
  feedRef,
}: {
  clusters: Cluster[];
  isGenerating: boolean;
  onOpenViewer: (image: ImageItem) => void;
  onDownload: (image: ImageItem) => void;
  onDeleteCluster: (clusterId: string) => void;
  onOpenVault: () => void;
  hasSupportedKey: boolean;
  hasAnyKey: boolean;
  feedRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={feedRef}
      className="absolute inset-x-0 bottom-32 top-8 overflow-y-auto px-6 pb-10 md:bottom-36 md:top-10"
    >
      <div className="mx-auto flex w-full max-w-[980px] flex-col gap-8">
        {clusters.length === 0 && (
          <div className="glass-panel rounded-3xl p-6">
            <p className="text-sm theme-text-muted">
              Add your API keys to unlock image generation, then craft a prompt
              below.
            </p>
            <p className="mt-2 text-xs theme-text-subtle">
              Your keys stay in this browser and can be removed anytime.
            </p>
            <div className="mt-4">
              <Button variant="outline" onClick={onOpenVault}>
                Open Key Vault
              </Button>
            </div>
          </div>
        )}
        <AnimatePresence>
          {clusters.map((cluster) => {
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
                className="glass-panel rounded-3xl p-5 theme-card-hover"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] theme-text-faint">
                      Prompt
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      {cluster.prompt}
                    </p>
                    <p className="mt-1 text-xs theme-text-subtle">
                      {cluster.model}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full theme-chip px-3 py-1 text-[10px] uppercase tracking-[0.2em] theme-text-subtle">
                      {cluster.status === "loading"
                        ? `Generating ${completedCount}/${images.length}`
                        : cluster.status === "error"
                          ? "Error"
                          : "Ready"}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteCluster(cluster.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-full theme-surface-ghost theme-text-subtle transition hover:text-[color:var(--foreground)]"
                      aria-label="Delete prompt"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {cluster.status === "error" && (
                  <div className="mb-4 rounded-2xl px-4 py-3 text-xs theme-alert-error">
                    {cluster.errorMessage ||
                      "Generation failed. Please check your API key or quota."}
                  </div>
                )}
                {cluster.status === "ready" && hasAnyErrors && (
                  <div className="mb-4 rounded-2xl px-4 py-3 text-xs theme-alert-warning">
                    {cluster.errorMessage || "Some images failed to generate."}
                  </div>
                )}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                    {images.map((image, index) => (
                      <div
                        key={image.id}
                        onClick={() => image.src && onOpenViewer(image)}
                        className={cn(
                          "group relative aspect-square w-full overflow-hidden rounded-2xl border theme-border theme-card-hover",
                          cluster.status === "loading" && "shimmer",
                          image.src && "cursor-zoom-in"
                        )}
                      >
                        {image.status === "error" ? (
                          <div className="flex h-full w-full items-center justify-center text-xs theme-alert-error">
                            Failed
                          </div>
                        ) : image.status === "loading" ? (
                          <div className="h-full w-full theme-fill-ghost" />
                        ) : (
                          <img
                            src={image.src}
                            alt={image.alt}
                            className="h-full w-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 theme-image-overlay" />
                        <span className="absolute bottom-2 right-2 rounded-full theme-chip px-2 py-1 text-[10px] theme-text-subtle">
                          {index + 1}
                        </span>
                        {image.src && (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              onDownload(image);
                            }}
                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full theme-surface-ghost theme-border-strong theme-text-muted opacity-0 transition group-hover:opacity-100"
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
        {!hasSupportedKey && clusters.length > 0 && !isGenerating && !hasAnyKey && (
          <div className="rounded-2xl border theme-border theme-surface px-4 py-3 text-xs theme-text-subtle">
            Add API keys in the vault to unlock models.
          </div>
        )}
      </div>
    </div>
  );
}
