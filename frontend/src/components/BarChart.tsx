import type { DailyPoint } from "../types";

/** Lightweight stacked bar chart (success/failed per day) rendered as inline SVG. */
export function BarChart({ data }: { data: DailyPoint[] }) {
  const width = 100;
  const height = 42;
  const gap = 1.5;
  const n = data.length || 1;
  const barW = (width - gap * (n - 1)) / n;
  const maxTotal = Math.max(1, ...data.map((d) => d.success + d.failed));

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-40 w-full"
        role="img"
        aria-label="Günlük çalışma grafiği"
      >
        {data.map((d, i) => {
          const total = d.success + d.failed;
          const x = i * (barW + gap);
          const sH = (d.success / maxTotal) * height;
          const fH = (d.failed / maxTotal) * height;
          return (
            <g key={d.date}>
              {total === 0 && (
                <rect x={x} y={height - 0.6} width={barW} height={0.6} fill="#2a3450" rx={0.3} />
              )}
              {fH > 0 && (
                <rect x={x} y={height - fH} width={barW} height={fH} fill="#fb7185" rx={0.4} />
              )}
              {sH > 0 && (
                <rect
                  x={x}
                  y={height - fH - sH}
                  width={barW}
                  height={sH}
                  fill="#34d399"
                  rx={0.4}
                />
              )}
              <title>
                {d.date}: {d.success} başarılı, {d.failed} başarısız
              </title>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-slate-500">
        <span>{data[0]?.date.slice(5)}</span>
        <span>{data[data.length - 1]?.date.slice(5)}</span>
      </div>
      <div className="mt-2 flex gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" /> Başarılı
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-rose-400" /> Başarısız
        </span>
      </div>
    </div>
  );
}
