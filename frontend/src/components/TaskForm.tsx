import { useState } from "react";
import type { HttpMethod, Task, TaskInput, TaskType } from "../types";

interface Props {
  initial?: Task | null;
  onCancel: () => void;
  onSubmit: (data: TaskInput) => Promise<void>;
}

const CRON_PRESETS = [
  { label: "Manuel (zamanlama yok)", value: "" },
  { label: "Her dakika", value: "* * * * *" },
  { label: "Her 5 dakika", value: "*/5 * * * *" },
  { label: "Saatlik", value: "0 * * * *" },
  { label: "Her gün 09:00", value: "0 9 * * *" },
];

export function TaskForm({ initial, onCancel, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [taskType, setTaskType] = useState<TaskType>(initial?.task_type ?? "command");
  const [command, setCommand] = useState(initial?.command ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [httpMethod, setHttpMethod] = useState(initial?.http_method ?? "GET");
  const [schedule, setSchedule] = useState(initial?.schedule ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isPreset = CRON_PRESETS.some((p) => p.value === schedule);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        name,
        description: description || undefined,
        task_type: taskType,
        command: taskType === "command" ? command : undefined,
        url: taskType === "http" ? url : undefined,
        http_method: httpMethod as TaskInput["http_method"],
        schedule: schedule || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi");
      setSaving(false);
    }
  }

  const field = "w-full rounded-lg border border-edge bg-base px-3 py-2 text-sm outline-none focus:border-accent";
  const label = "mb-1 block text-xs font-medium text-slate-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-edge bg-panel p-6 shadow-2xl"
      >
        <h2 className="mb-4 text-lg font-semibold">
          {initial ? "Görevi Düzenle" : "Yeni Görev"}
        </h2>

        <div className="space-y-4">
          <div>
            <label className={label}>Ad</label>
            <input className={field} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div>
            <label className={label}>Açıklama</label>
            <input
              className={field}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="İsteğe bağlı"
            />
          </div>

          <div>
            <label className={label}>Tür</label>
            <div className="flex gap-2">
              {(["command", "http"] as TaskType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTaskType(t)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                    taskType === t
                      ? "border-accent bg-accent/20 text-white"
                      : "border-edge bg-base text-slate-400"
                  }`}
                >
                  {t === "command" ? "Komut" : "HTTP İsteği"}
                </button>
              ))}
            </div>
          </div>

          {taskType === "command" ? (
            <div>
              <label className={label}>Komut</label>
              <input
                className={`${field} font-mono`}
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="echo hello"
              />
            </div>
          ) : (
            <div className="grid grid-cols-[100px_1fr] gap-2">
              <div>
                <label className={label}>Metod</label>
                <select
                  className={field}
                  value={httpMethod}
                  onChange={(e) => setHttpMethod(e.target.value as HttpMethod)}
                >
                  {["GET", "POST", "PUT", "DELETE", "PATCH"].map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label}>URL</label>
                <input
                  className={`${field} font-mono`}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://api.example.com/health"
                />
              </div>
            </div>
          )}

          <div>
            <label className={label}>Zamanlama (cron)</label>
            <select
              className={field}
              value={isPreset ? schedule : "custom"}
              onChange={(e) => e.target.value !== "custom" && setSchedule(e.target.value)}
            >
              {CRON_PRESETS.map((p) => (
                <option key={p.label} value={p.value}>
                  {p.label}
                </option>
              ))}
              <option value="custom">Özel…</option>
            </select>
            {!isPreset && (
              <input
                className={`${field} mt-2 font-mono`}
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                placeholder="*/10 * * * *"
              />
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-edge px-4 py-2 text-sm text-slate-300 hover:bg-panel2"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}
