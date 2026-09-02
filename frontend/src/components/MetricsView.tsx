import { useEffect, useState } from "react";
import { api } from "../api";
import type { Metrics } from "../types";
import { BarChart } from "./BarChart";
import { StatusBadge } from "./StatusBadge";

function fmtDuration(sec: number | null): string {
  if (sec === null) return "—";
  if (sec < 1) return `${Math.round(sec * 1000)} ms`;
  if (sec < 60) return `${sec.toFixed(1)} sn`;
  return `${Math.floor(sec / 60)}dk ${Math.round(sec % 60)}sn`;
}

const TILES = (m: Metrics) => [
  { label: "Başarı Oranı", value: `%${m.success_rate}`, tint: "text-emerald-400" },
  { label: "Ort. Süre", value: fmtDuration(m.avg_duration), tint: "text-accent2" },
  { label: "En Uzun", value: fmtDuration(m.max_duration), tint: "text-indigo-300" },
  { label: "Toplam Çalışma", value: String(m.total_runs), tint: "text-white" },
];

export function MetricsView() {
  const [m, setM] = useState<Metrics | null>(null);

  useEffect(() => {
    const load = () => api.metrics().then(setM).catch(() => {});
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  if (!m) return <p className="p-8 text-center text-sm text-slate-500">Yükleniyor…</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {TILES(m).map((t) => (
          <div key={t.label} className="rounded-xl border border-edge bg-panel/70 px-4 py-3">
            <div className={`text-2xl font-semibold ${t.tint}`}>{t.value}</div>
            <div className="mt-1 text-xs text-slate-400">{t.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-edge bg-panel/60 p-5">
        <h3 className="mb-4 text-sm font-medium text-slate-300">Son 14 gün · çalışma dağılımı</h3>
        <BarChart data={m.daily} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-edge bg-panel/60">
        <h3 className="border-b border-edge px-5 py-3 text-sm font-medium text-slate-300">
          Son çalışmalar
        </h3>
        {m.recent.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">Henüz çalışma yok.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-2.5">Görev</th>
                <th className="px-5 py-2.5">Durum</th>
                <th className="px-5 py-2.5">Tetikleyici</th>
                <th className="px-5 py-2.5">Süre</th>
                <th className="px-5 py-2.5">Zaman</th>
              </tr>
            </thead>
            <tbody>
              {m.recent.map((r) => (
                <tr key={r.id} className="border-t border-edge/50">
                  <td className="px-5 py-2.5 text-slate-200">{r.task_name}</td>
                  <td className="px-5 py-2.5">
                    <StatusBadge status={r.status} small />
                  </td>
                  <td className="px-5 py-2.5 text-xs text-slate-400">{r.trigger}</td>
                  <td className="px-5 py-2.5 font-mono text-xs text-slate-400">
                    {fmtDuration(r.duration)}
                  </td>
                  <td className="px-5 py-2.5 text-xs text-slate-500">
                    {new Date(r.started_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
