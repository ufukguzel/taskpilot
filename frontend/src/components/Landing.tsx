import { useEffect, useState } from "react";
import { api } from "../api";
import { Login } from "./Login";

const FEATURES = [
  { icon: "⏰", title: "Cron Zamanlama", desc: "Görevleri cron ifadeleriyle otomatik çalıştır." },
  { icon: "🔴", title: "Canlı Log", desc: "WebSocket ile çıktı satır satır anlık akar." },
  { icon: "📊", title: "Metrikler", desc: "Başarı oranı, süreler ve günlük grafikler." },
  { icon: "🔔", title: "Bildirimler", desc: "Başarısızlıkta webhook / e-posta uyarısı." },
];

const STACK = ["FastAPI", "React", "TypeScript", "WebSocket", "Docker"];

export function Landing({ onSuccess }: { onSuccess: () => void }) {
  const [mode, setMode] = useState<"landing" | "login">("landing");
  const [demoUser, setDemoUser] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    api.health().then((h) => setDemoUser(h.demo_mode ? h.demo_user : null)).catch(() => {});
  }, []);

  async function tryDemo() {
    if (!demoUser) return;
    setDemoLoading(true);
    try {
      await api.login(demoUser, "demo1234");
      onSuccess();
    } catch {
      setDemoLoading(false);
    }
  }

  if (mode === "login") {
    return <Login onSuccess={onSuccess} onBack={() => setMode("landing")} />;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-edge bg-panel/60 px-3 py-1 text-xs text-slate-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Full-stack otomasyon panosu
      </div>

      <h1 className="flex items-center gap-3 text-4xl font-bold sm:text-5xl">
        <span className="text-accent2">◈</span> TaskPilot
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-400">
        Tekrarlayan işleri (komut çalıştırma, API kontrolü) zamanla, tek tıkla çalıştır ve
        sonuçlarını canlı olarak izle. Cron zamanlama, gerçek zamanlı log, metrikler ve bildirimler
        — hepsi tek panoda.
      </p>

      <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-edge bg-panel/60 p-4 text-left transition hover:border-accent/40"
          >
            <div className="text-2xl">{f.icon}</div>
            <div className="mt-2 text-sm font-semibold text-slate-100">{f.title}</div>
            <div className="mt-1 text-xs leading-relaxed text-slate-400">{f.desc}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {STACK.map((s) => (
          <span
            key={s}
            className="rounded-full border border-edge bg-base px-3 py-1 text-xs text-slate-400"
          >
            {s}
          </span>
        ))}
      </div>

      <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
        <button
          onClick={() => setMode("login")}
          className="rounded-xl bg-accent px-6 py-3 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          Giriş yap →
        </button>
        {demoUser && (
          <button
            onClick={tryDemo}
            disabled={demoLoading}
            className="rounded-xl border border-edge bg-panel/60 px-6 py-3 text-sm font-medium text-slate-200 transition hover:border-accent/40 disabled:opacity-50"
          >
            {demoLoading ? "Demo açılıyor…" : "🎭 Demo hesabıyla dene"}
          </button>
        )}
      </div>

      <a
        href="https://github.com/ufukguzel/taskpilot"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 text-xs text-slate-500 hover:text-slate-300"
      >
        Kaynak kodu · GitHub ↗
      </a>
    </div>
  );
}
