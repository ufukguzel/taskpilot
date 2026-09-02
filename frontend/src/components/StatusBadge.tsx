import type { RunStatus } from "../types";

const STYLES: Record<RunStatus, string> = {
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  failed: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  running: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

const LABELS: Record<RunStatus, string> = {
  success: "Başarılı",
  failed: "Başarısız",
  running: "Çalışıyor",
};

export function StatusBadge({ status, small }: { status: RunStatus; small?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${STYLES[status]} ${
        small ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      }`}
    >
      {LABELS[status]}
    </span>
  );
}
