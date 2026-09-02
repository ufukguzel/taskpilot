import { useEffect, useRef } from "react";
import type { LiveRun } from "../types";
import { StatusBadge } from "./StatusBadge";

export function LiveConsole({ run, onClose }: { run: LiveRun; onClose: () => void }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [run.lines.length]);

  const running = run.status === "running";

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[min(560px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-edge bg-panel shadow-2xl">
      <div className="flex items-center justify-between border-b border-edge bg-panel2 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              running ? "animate-pulse bg-amber-400" : "bg-slate-500"
            }`}
          />
          <span className="text-sm font-medium">Canlı Konsol · {run.taskName}</span>
          <span className="text-xs text-slate-500">({run.trigger})</span>
        </div>
        <div className="flex items-center gap-2">
          {!running && <StatusBadge status={run.status} small />}
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      </div>
      <div className="h-64 overflow-y-auto bg-black/50 p-3 font-mono text-xs leading-relaxed text-slate-300">
        {run.lines.length === 0 && (
          <span className="text-slate-600">{running ? "Bekleniyor…" : "(çıktı yok)"}</span>
        )}
        {run.lines.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap break-words">
            {line || " "}
          </div>
        ))}
        {running && <span className="animate-pulse text-accent2">▋</span>}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
