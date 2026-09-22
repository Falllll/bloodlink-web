import { getTranslations } from "next-intl/server";
import { FormatPreview } from "@/components/i18n/format-preview";
import { GlassPanel } from "@/components/ui/glass-panel";
import { StatusChip, type BatchStatus } from "@/components/ui/status-chip";
import { BloodBatchesProbe } from "./blood-batches-probe";

const STATUSES: BatchStatus[] = [
  "QUARANTINED",
  "TESTING",
  "RELEASED",
  "RESERVED",
  "DISCARDED",
  "EXPIRED",
];

export default async function Home() {
  const t = await getTranslations("shell");

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <GlassPanel className="flex max-w-lg flex-col gap-6 p-8">
        <p className="font-display text-2xl font-semibold text-[color:var(--color-ink-strong)]">
          {t("devHeading")}
        </p>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((status) => (
            <StatusChip key={status} status={status} />
          ))}
        </div>
        <BloodBatchesProbe />
        <FormatPreview km={4.2} at={new Date("2026-09-22T10:30:00+07:00")} />
      </GlassPanel>
    </div>
  );
}
