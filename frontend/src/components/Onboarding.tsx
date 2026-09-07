import { useEffect, useState } from "react";
import { api } from "../api";

const STEPS = [
  {
    icon: "➕",
    title: "1 · Görev oluştur",
    desc: "“+ Yeni Görev” ile komut (shell) veya HTTP isteği tipinde bir görev tanımla.",
  },
  {
    icon: "▶️",
    title: "2 · Zamanla veya çalıştır",
    desc: "Cron ifadesiyle otomatik çalıştır ya da “Çalıştır” ile hemen tetikle.",
  },
  {
    icon: "🔴",
    title: "3 · Canlı izle",
    desc: "Çıktı canlı akar; “Geçmiş” ve “Metrikler” sekmesinde sonuçları gör.",
  },
];

export function Onboarding({ onClose, onSeeded }: { onClose: () => void; onSeeded: () => void }) {
  const [demo, setDemo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.health().then((h) => setDemo(!!h.demo_mode)).catch(() => {});
  }, []);

  async function seedSamples() {
    setBusy(true);
    setError(null);
    try {
      await api.createTask({
        name: "Site Sağlık Kontrolü",
        description: "Bir sitenin ayakta olup olmadığını kontrol eder (örnek)",
        task_type: "http",
        url: "https://example.com",
        http_method: "GET",
      });
      await api.createTask({
        name: "Merhaba (komut örneği)",
        description: "Basit bir shell komutu örneği",
        task_type: "command",
        command: "echo Merhaba TaskPilot",
      });
      onSeeded();
      onClose(); // only dismiss the tour once samples were actually created
    } catch {
      setError("Örnek görevler oluşturulamadı. Tekrar deneyebilir veya kendin başlayabilirsin.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-edge bg-panel p-6 shadow-2xl">
        <h2 className="text-lg font-semibold">👋 TaskPilot'a hoş geldin</h2>
        <p className="mt-1 text-sm text-slate-400">3 adımda nasıl çalıştığına bakalım:</p>

        <div className="mt-5 space-y-3">
          {STEPS.map((s) => (
            <div key={s.title} className="flex gap-3 rounded-xl border border-edge bg-base/60 p-3">
              <div className="text-xl">{s.icon}</div>
              <div>
                <div className="text-sm font-medium text-slate-100">{s.title}</div>
                <div className="mt-0.5 text-xs leading-relaxed text-slate-400">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {demo && (
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            🎭 Demo modundasın: güvenlik için komut çalıştırma devre dışı. <b>HTTP tipi</b> görevler
            tam çalışır — onlarla dene.
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          <button
            onClick={seedSamples}
            disabled={busy}
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {busy ? "Oluşturuluyor…" : "✨ Örnek görevler oluştur"}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-edge px-4 py-2.5 text-sm text-slate-300 hover:bg-panel2"
          >
            Kendim başlarım
          </button>
        </div>
      </div>
    </div>
  );
}
