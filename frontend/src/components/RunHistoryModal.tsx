import { useEffect, useState } from "react";
import { api } from "../api";
import type { Task, TaskRun } from "../types";
import { StatusBadge } from "./StatusBadge";

export function RunHistoryModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const [runs, setRuns] = useState<TaskRun[] | null>(null);
  const [selected, setSelected] = useState<TaskRun | null>(null);

  useEffect(() => {
    api.taskRuns(task.id).then((r) => {
      setRuns(r);
      setSelected(r[0] ?? null);
    });
  }, [task.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="flex h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-edge bg-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-edge px-5 py-3">
          <div>
            <h2 className="font-semibold">{task.name}</h2>
            <p className="text-xs text-slate-400">Çalışma geçmişi</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="grid flex-1 grid-cols-[220px_1fr] overflow-hidden">
          <div className="overflow-y-auto border-r border-edge">
            {runs === null && <p className="p-4 text-sm text-slate-500">Yükleniyor…</p>}
            {runs?.length === 0 && (
              <p className="p-4 text-sm text-slate-500">Henüz çalışma yok.</p>
            )}
            {runs?.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className={`flex w-full items-center justify-between gap-2 border-b border-edge/60 px-3 py-2.5 text-left text-xs ${
                  selected?.id === r.id ? "bg-panel2" : "hover:bg-panel2/50"
                }`}
              >
                <span className="truncate text-slate-300">
                  {new Date(r.started_at).toLocaleString()}
                </span>
                <StatusBadge status={r.status} small />
              </button>
            ))}
          </div>

          <div className="overflow-y-auto bg-base/50 p-4">
            {selected ? (
              <>
                <div className="mb-3 flex flex-wrap gap-3 text-xs text-slate-400">
                  <span>Tetikleyici: <b className="text-slate-200">{selected.trigger}</b></span>
                  <span>Durum: <StatusBadge status={selected.status} small /></span>
                </div>
                <pre className="whitespace-pre-wrap break-words rounded-lg border border-edge bg-black/40 p-3 font-mono text-xs text-slate-300">
                  {selected.output || "(çıktı yok)"}
                </pre>
              </>
            ) : (
              <p className="text-sm text-slate-500">Bir çalışma seçin.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
