import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import { StatsBar } from "./components/StatsBar";
import { StatusBadge } from "./components/StatusBadge";
import { TaskForm } from "./components/TaskForm";
import { RunHistoryModal } from "./components/RunHistoryModal";
import { LiveConsole } from "./components/LiveConsole";
import { useLiveRuns } from "./hooks/useLiveRuns";
import type { Stats, Task, TaskInput } from "./types";

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [historyTask, setHistoryTask] = useState<Task | null>(null);
  const [runningId, setRunningId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [t, s] = await Promise.all([api.listTasks(), api.stats()]);
      setTasks(t);
      setStats(s);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sunucuya ulaşılamadı");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [refresh]);

  const { liveRun, connected, dismiss } = useLiveRuns({ onFinished: refresh });

  async function handleSubmit(data: TaskInput) {
    if (editing) await api.updateTask(editing.id, data);
    else await api.createTask(data);
    setFormOpen(false);
    setEditing(null);
    await refresh();
  }

  async function runNow(task: Task) {
    setRunningId(task.id);
    try {
      await api.runTask(task.id);
      await refresh();
    } finally {
      setRunningId(null);
    }
  }

  async function toggle(task: Task) {
    await api.updateTask(task.id, { enabled: !task.enabled });
    await refresh();
  }

  async function remove(task: Task) {
    if (!confirm(`"${task.name}" silinsin mi?`)) return;
    await api.deleteTask(task.id);
    await refresh();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <span className="text-accent2">◈</span> TaskPilot
          </h1>
          <p className="flex items-center gap-2 text-sm text-slate-400">
            Otomasyon görevlerini zamanla, çalıştır ve izle
            <span
              title={connected ? "Canlı bağlantı açık" : "Bağlantı yok"}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${
                connected
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-slate-500/15 text-slate-400"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  connected ? "animate-pulse bg-emerald-400" : "bg-slate-500"
                }`}
              />
              {connected ? "canlı" : "bağlı değil"}
            </span>
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          + Yeni Görev
        </button>
      </header>

      <div className="mb-6">
        <StatsBar stats={stats} />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error} — backend çalışıyor mu? (uvicorn :8000)
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-edge bg-panel/60">
        {loading ? (
          <p className="p-8 text-center text-sm text-slate-500">Yükleniyor…</p>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400">Henüz görev yok.</p>
            <button
              onClick={() => setFormOpen(true)}
              className="mt-3 text-sm text-accent2 hover:underline"
            >
              İlk görevini oluştur →
            </button>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-edge text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Görev</th>
                <th className="px-4 py-3">Tür</th>
                <th className="px-4 py-3">Zamanlama</th>
                <th className="px-4 py-3">Son Çalışma</th>
                <th className="px-4 py-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-b border-edge/50 last:border-0 hover:bg-panel2/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggle(task)}
                        title={task.enabled ? "Devre dışı bırak" : "Etkinleştir"}
                        className={`h-2.5 w-2.5 rounded-full ${
                          task.enabled ? "bg-emerald-400" : "bg-slate-600"
                        }`}
                      />
                      <div>
                        <div className="font-medium text-slate-100">{task.name}</div>
                        {task.description && (
                          <div className="text-xs text-slate-500">{task.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-panel2 px-2 py-0.5 text-xs text-slate-300">
                      {task.task_type === "command" ? "Komut" : task.http_method}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">
                    {task.schedule || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {task.last_run ? (
                      <button
                        onClick={() => setHistoryTask(task)}
                        className="inline-flex items-center gap-2"
                      >
                        <StatusBadge status={task.last_run.status} small />
                        <span className="text-xs text-slate-500">
                          {new Date(task.last_run.started_at).toLocaleTimeString()}
                        </span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-600">hiç</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => runNow(task)}
                        disabled={runningId === task.id}
                        className="rounded-md bg-accent/20 px-2.5 py-1 text-xs text-accent2 hover:bg-accent/30 disabled:opacity-50"
                      >
                        {runningId === task.id ? "…" : "▶ Çalıştır"}
                      </button>
                      <button
                        onClick={() => setHistoryTask(task)}
                        className="rounded-md border border-edge px-2.5 py-1 text-xs text-slate-300 hover:bg-panel2"
                      >
                        Geçmiş
                      </button>
                      <button
                        onClick={() => {
                          setEditing(task);
                          setFormOpen(true);
                        }}
                        className="rounded-md border border-edge px-2.5 py-1 text-xs text-slate-300 hover:bg-panel2"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => remove(task)}
                        className="rounded-md border border-edge px-2.5 py-1 text-xs text-rose-400 hover:bg-rose-500/10"
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <footer className="mt-6 text-center text-xs text-slate-600">
        TaskPilot · FastAPI + React · otomatik yenileme 5sn
      </footer>

      {formOpen && (
        <TaskForm
          initial={editing}
          onCancel={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSubmit={handleSubmit}
        />
      )}
      {historyTask && (
        <RunHistoryModal task={historyTask} onClose={() => setHistoryTask(null)} />
      )}
      {liveRun && <LiveConsole run={liveRun} onClose={dismiss} />}
    </div>
  );
}
