import { GlassPanel } from "@/components/ui/glass-panel";
import { StatusChip, type BatchStatus } from "@/components/ui/status-chip";

const STATUSES: BatchStatus[] = [
  "QUARANTINED",
  "TESTING",
  "RELEASED",
  "RESERVED",
  "DISCARDED",
  "EXPIRED",
];

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <GlassPanel className="flex max-w-lg flex-col gap-6 p-8">
        <p className="font-display text-2xl font-semibold text-[color:var(--color-ink-strong)]">
          BloodLink — token & komponen dasar
        </p>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((status) => (
            <StatusChip key={status} status={status} />
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}
