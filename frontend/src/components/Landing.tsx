import { useEffect, useState } from "react";
import { api } from "../api";
import { Login } from "./Login";
import { useScrollReveal } from "../hooks/useScrollReveal";

const FEATURES = [
  { icon: "⏰", title: "Cron Zamanlama", desc: "Görevleri cron ifadeleriyle otomatik çalıştır — her 5 dakika, her sabah 09:00…" },
  { icon: "🔴", title: "Canlı Log", desc: "WebSocket ile çalışan görevin çıktısı satır satır anlık akar." },
  { icon: "🔐", title: "JWT Kimlik Doğrulama", desc: "Korumalı API ve WebSocket, oturum yönetimi ile güvenli erişim." },
  { icon: "📊", title: "Metrikler & Grafikler", desc: "Başarı oranı, ortalama süre ve son 14 günün çalışma dağılımı." },
  { icon: "🔔", title: "Bildirimler", desc: "Görev başarısız olunca webhook veya e-posta ile anında haber al." },
  { icon: "🐳", title: "Docker & CI/CD", desc: "Tek komutla ayağa kalkar; her push'ta testler otomatik çalışır." },
];

const STEPS = [
  { n: "1", title: "Görev oluştur", desc: "Komut (shell) veya HTTP isteği tipinde bir görev tanımla." },
  { n: "2", title: "Zamanla ya da çalıştır", desc: "Cron ile otomatikleştir veya tek tıkla hemen tetikle." },
  { n: "3", title: "Canlı izle", desc: "Çıktıyı anlık gör; geçmiş ve metriklerle takip et." },
];

const STACK = ["FastAPI", "React", "TypeScript", "SQLAlchemy", "APScheduler", "WebSocket", "Tailwind", "Docker"];

export function Landing({ onSuccess }: { onSuccess: () => void }) {
  const [mode, setMode] = useState<"landing" | "login">("landing");
  const [demoUser, setDemoUser] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    api.health().then((h) => setDemoUser(h.demo_mode ? h.demo_user : null)).catch(() => {});
  }, []);

  useScrollReveal([mode]);

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

  const primaryBtn =
    "rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition hover:-translate-y-0.5 hover:bg-indigo-500";
  const ghostBtn =
    "rounded-xl border border-edge bg-panel/60 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:-translate-y-0.5 hover:border-accent/40 disabled:opacity-50";

  return (
    <div className="relative overflow-hidden">
      {/* animated background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="blob" style={{ width: 480, height: 480, top: -120, right: -80, background: "#4f46e5" }} />
        <div className="blob" style={{ width: 420, height: 420, bottom: -140, left: -100, background: "#0891b2", animationDelay: "3s" }} />
        <div className="blob" style={{ width: 320, height: 320, top: "40%", left: "55%", background: "#7c3aed", animationDelay: "6s" }} />
      </div>

      {/* nav */}
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <span className="flex items-center gap-2 font-bold">
          <span className="text-accent2">◈</span> TaskPilot
        </span>
        <div className="flex items-center gap-4 text-sm">
          <a
            href="https://github.com/ufukguzel/taskpilot"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 transition hover:text-slate-100"
          >
            GitHub ↗
          </a>
          <button onClick={() => setMode("login")} className="text-slate-300 transition hover:text-white">
            Giriş yap
          </button>
        </div>
      </nav>

      {/* hero */}
      <header className="mx-auto max-w-3xl px-5 pb-16 pt-14 text-center sm:pt-20">
        <div
          className="animate-fade-up mb-5 inline-flex items-center gap-2 rounded-full border border-edge bg-panel/60 px-3 py-1 text-xs text-slate-400"
          style={{ animationDelay: "0.05s" }}
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Full-stack otomasyon panosu · canlı demo
        </div>
        <h1
          className="animate-fade-up text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl"
          style={{ animationDelay: "0.12s" }}
        >
          İşlerini <span className="gradient-text">otomatikleştir</span>,
          <br className="hidden sm:block" /> gerisini TaskPilot halletsin
        </h1>
        <p
          className="animate-fade-up mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg"
          style={{ animationDelay: "0.2s" }}
        >
          Komutları ve API kontrollerini zamanla, tek tıkla çalıştır ve sonuçlarını gerçek zamanlı
          izle. Cron zamanlama, canlı log, metrikler ve bildirimler — hepsi tek panoda.
        </p>
        <div
          className="animate-fade-up mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          style={{ animationDelay: "0.28s" }}
        >
          <button onClick={() => setMode("login")} className={primaryBtn}>
            Giriş yap →
          </button>
          {demoUser && (
            <button onClick={tryDemo} disabled={demoLoading} className={ghostBtn}>
              {demoLoading ? "Demo açılıyor…" : "🎭 Demo hesabıyla dene"}
            </button>
          )}
        </div>
      </header>

      {/* features */}
      <section className="mx-auto max-w-5xl px-5 py-14">
        <h2 className="reveal mb-2 text-center text-2xl font-bold">Neler yapabilir?</h2>
        <p className="reveal mx-auto mb-10 max-w-lg text-center text-sm text-slate-400">
          Küçük bir ekip veya tek kişi için, üretime hazır bir otomasyon aracının tüm parçaları.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="reveal rounded-2xl border border-edge bg-panel/50 p-5 backdrop-blur transition hover:-translate-y-1 hover:border-accent/40 hover:bg-panel/80"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <div className="text-2xl">{f.icon}</div>
              <h3 className="mt-3 font-semibold text-slate-100">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* how it works */}
      <section className="mx-auto max-w-5xl px-5 py-14">
        <h2 className="reveal mb-10 text-center text-2xl font-bold">Nasıl çalışır?</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className="reveal relative rounded-2xl border border-edge bg-panel/50 p-6"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-lg font-bold text-accent2">
                {s.n}
              </div>
              <h3 className="mt-4 font-semibold text-slate-100">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* tech stack */}
      <section className="mx-auto max-w-4xl px-5 py-14 text-center">
        <h2 className="reveal mb-6 text-xl font-bold text-slate-200">Modern bir stack üzerine kurulu</h2>
        <div className="reveal flex flex-wrap justify-center gap-2.5">
          {STACK.map((s) => (
            <span
              key={s}
              className="rounded-full border border-edge bg-panel/60 px-4 py-2 text-sm text-slate-300"
            >
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* final CTA */}
      <section className="mx-auto max-w-3xl px-5 pb-20 pt-6">
        <div className="reveal rounded-3xl border border-edge bg-gradient-to-br from-accent/15 via-panel/60 to-accent2/10 p-10 text-center">
          <h2 className="text-2xl font-bold">Hemen denemeye başla</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            Demo hesabıyla saniyeler içinde gir, örnek görevlerle canlı logu ve metrikleri keşfet.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button onClick={() => setMode("login")} className={primaryBtn}>
              Giriş yap →
            </button>
            {demoUser && (
              <button onClick={tryDemo} disabled={demoLoading} className={ghostBtn}>
                {demoLoading ? "Demo açılıyor…" : "🎭 Demo dene"}
              </button>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-edge/60 py-8 text-center text-xs text-slate-500">
        TaskPilot · FastAPI + React · {" "}
        <a
          href="https://github.com/ufukguzel/taskpilot"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-slate-200"
        >
          github.com/ufukguzel/taskpilot
        </a>
      </footer>
    </div>
  );
}
