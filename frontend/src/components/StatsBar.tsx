import type { Stats } from "../types";

const CARDS: { key: keyof Stats; label: string; tint: string }[] = [
  { key: "total_tasks", label: "Toplam Görev", tint: "text-white" },
  { key: "enabled_tasks", label: "Aktif", tint: "text-emerald-400" },
  { key: "scheduled_tasks", label: "Zamanlanmış", tint: "text-accent2" },
  { key: "total_runs", label: "Çalışma", tint: "text-indigo-300" },
  { key: "failed_runs", label: "Başarısız", tint: "text-rose-400" },
];

export function StatsBar({ stats }: { stats: Stats | null }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {CARDS.map((c) => (
        <div
          key={c.key}
          className="rounded-xl border border-edge bg-panel/70 px-4 py-3 backdrop-blur"
        >
          <div className={`text-2xl font-semibold tabular-nums ${c.tint}`}>
            {stats ? stats[c.key] : "—"}
          </div>
          <div className="mt-1 text-xs text-slate-400">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
