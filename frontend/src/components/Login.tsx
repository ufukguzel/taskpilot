import { useState } from "react";
import { api } from "../api";

export function Login({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.login(username, password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Giriş başarısız");
      setLoading(false);
    }
  }

  const field =
    "w-full rounded-lg border border-edge bg-base px-3 py-2.5 text-sm outline-none focus:border-accent";

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-edge bg-panel p-7 shadow-2xl"
      >
        <div className="mb-6 text-center">
          <h1 className="flex items-center justify-center gap-2 text-2xl font-bold">
            <span className="text-accent2">◈</span> TaskPilot
          </h1>
          <p className="mt-1 text-sm text-slate-400">Devam etmek için giriş yap</p>
        </div>

        <div className="space-y-3">
          <input
            className={field}
            placeholder="Kullanıcı adı"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            required
          />
          <input
            className={field}
            type="password"
            placeholder="Parola"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "Giriş yapılıyor…" : "Giriş yap"}
        </button>
      </form>
    </div>
  );
}
