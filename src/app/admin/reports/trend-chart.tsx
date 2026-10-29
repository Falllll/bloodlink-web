'use client';

type Series = {
  key: string;
  label: string;
  values: Array<number | null>;
  color: string;
  kind: 'bar' | 'line';
  // Pembeda selain warna, untuk seri yang warnanya mudah tertukar dengan grid.
  dashed?: boolean;
};

const WIDTH = 640;
const HEIGHT = 220;
const PAD = { top: 12, right: 12, bottom: 28, left: 12 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;
const DASH = '6 4';

export function TrendChart({
  title,
  labels,
  series,
  formatValue,
}: {
  title: string;
  labels: string[];
  series: Series[];
  formatValue: (value: number | null) => string;
}) {
  const finite = series.flatMap((s) => s.values.filter((v): v is number => v !== null));
  const max = Math.max(0, ...finite);
  // Semua nol (atau semua null) tetap digambar di garis dasar, tanpa bagi nol.
  const scale = max > 0 ? PLOT_H / max : 0;

  const slot = labels.length > 0 ? PLOT_W / labels.length : PLOT_W;
  const bars = series.filter((s) => s.kind === 'bar');
  const barW = bars.length > 0 ? (slot * 0.7) / bars.length : 0;

  const x = (i: number) => PAD.left + slot * i + slot / 2;
  const y = (v: number) => PAD.top + PLOT_H - v * scale;
  const baseline = PAD.top + PLOT_H;

  return (
    <figure className="flex flex-col gap-2">
      <svg
        role="img"
        aria-label={title}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
      >
        <line
          x1={PAD.left}
          x2={WIDTH - PAD.right}
          y1={baseline}
          y2={baseline}
          stroke="var(--color-border)"
        />

        {bars.map((s, b) =>
          s.values.map((v, i) =>
            // null DILEWATI: tidak ada batang setinggi nol untuk nilai tak terdefinisi.
            v === null ? null : (
              <rect
                key={`${s.key}-${i}`}
                x={x(i) - (barW * bars.length) / 2 + barW * b}
                y={y(v)}
                width={Math.max(barW - 1, 1)}
                height={baseline - y(v)}
                fill={s.color}
                fillOpacity={0.35}
                stroke={s.color}
                strokeDasharray={s.dashed ? DASH : undefined}
              >
                <title>{`${labels[i]} · ${s.label}: ${formatValue(v)}`}</title>
              </rect>
            ),
          ),
        )}

        {series
          .filter((s) => s.kind === 'line')
          .map((s) => {
            // Garis diputus di setiap null, bukan ditarik ke garis dasar.
            const runs: Array<Array<[number, number]>> = [];
            let run: Array<[number, number]> = [];
            s.values.forEach((v, i) => {
              if (v === null) {
                if (run.length > 0) runs.push(run);
                run = [];
              } else {
                run.push([x(i), y(v)]);
              }
            });
            if (run.length > 0) runs.push(run);

            return (
              <g key={s.key}>
                {runs.map((points, r) =>
                  points.length > 1 ? (
                    <polyline
                      key={r}
                      points={points.map(([px, py]) => `${px},${py}`).join(' ')}
                      fill="none"
                      stroke={s.color}
                      strokeWidth={2}
                      strokeDasharray={s.dashed ? DASH : undefined}
                    />
                  ) : null,
                )}
                {s.values.map((v, i) =>
                  v === null ? null : (
                    <circle key={i} cx={x(i)} cy={y(v)} r={3.5} fill={s.color}>
                      <title>{`${labels[i]} · ${s.label}: ${formatValue(v)}`}</title>
                    </circle>
                  ),
                )}
              </g>
            );
          })}

        {labels.length > 0 ? (
          <>
            <text
              x={x(0)}
              y={HEIGHT - 8}
              textAnchor={labels.length > 1 ? 'start' : 'middle'}
              fontSize={11}
              fill="var(--color-ink-muted)"
            >
              {labels[0]}
            </text>
            {labels.length > 1 ? (
              <text
                x={x(labels.length - 1)}
                y={HEIGHT - 8}
                textAnchor="end"
                fontSize={11}
                fill="var(--color-ink-muted)"
              >
                {labels[labels.length - 1]}
              </text>
            ) : null}
          </>
        ) : null}
      </svg>

      <figcaption>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[color:var(--color-ink-soft)]">
          {series.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <svg aria-hidden="true" width={20} height={10} viewBox="0 0 20 10">
                {s.kind === 'bar' ? (
                  <rect
                    x={1}
                    y={1}
                    width={18}
                    height={8}
                    fill={s.color}
                    fillOpacity={0.35}
                    stroke={s.color}
                    strokeDasharray={s.dashed ? '3 2' : undefined}
                  />
                ) : (
                  <line
                    x1={0}
                    x2={20}
                    y1={5}
                    y2={5}
                    stroke={s.color}
                    strokeWidth={2}
                    strokeDasharray={s.dashed ? '4 3' : undefined}
                  />
                )}
              </svg>
              {s.label}
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}
