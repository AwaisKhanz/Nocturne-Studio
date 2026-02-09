"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ImageItem } from "@/app/providers";

export function ImageViewer({
  image,
  onClose,
}: {
  image: ImageItem | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!image} onOpenChange={onClose}>
      <DialogContent className="w-[min(92vw,1100px)] max-w-none">
        <DialogHeader>
          <DialogTitle>Image Preview</DialogTitle>
          <DialogDescription>Scroll to view the full image.</DialogDescription>
        </DialogHeader>
        {image && (
          <div className="max-h-[70vh] overflow-auto rounded-2xl border theme-border theme-overlay-soft p-2">
            <img src={image.src} alt={image.alt} className="h-auto w-full rounded-xl" />
          </div>
        )}
        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="ghost">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
