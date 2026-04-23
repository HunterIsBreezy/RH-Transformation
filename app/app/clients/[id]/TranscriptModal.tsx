"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TranscriptViewer } from "@/components/TranscriptViewer";
import type { meetings } from "@/db/schema";

type Segments = NonNullable<(typeof meetings.$inferSelect)["transcriptSegments"]>;

export function TranscriptButton({
  meetingTitle,
  transcriptText,
  transcriptSegments,
  highlight,
}: {
  meetingTitle: string;
  transcriptText: string | null;
  transcriptSegments?: Segments | null;
  highlight?: string;
}) {
  const [open, setOpen] = useState(false);

  if (!transcriptText && !transcriptSegments) {
    return (
      <span className="text-[11px] uppercase tracking-eyebrow text-bone-faint">
        Transcript pending
      </span>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-[11px] uppercase tracking-eyebrow text-copper hover:text-paper">
          View transcript
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl w-[90vw] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{meetingTitle}</DialogTitle>
          <DialogDescription>Transcript from Zoom recording.</DialogDescription>
        </DialogHeader>
        <div className="mt-2 overflow-auto flex-1 border border-line rounded-sm p-4 bg-bg-soft">
          <TranscriptViewer
            segments={transcriptSegments ?? null}
            transcriptText={transcriptText}
            highlight={highlight}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
