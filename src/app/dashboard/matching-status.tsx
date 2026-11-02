'use client';

import { useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { useApiQuery } from '@/lib/api/hooks';
import { translateApiError } from '@/lib/errors/translate-api-error';
import { CAMPAIGNS_PATH, type CampaignsResponse } from '@/lib/api/campaigns';
import { useFacilityChannel } from '@/lib/realtime/useFacilityChannel';

const HEAD = 'px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-[color:var(--color-ink-muted)]';
const CELL = 'px-3 py-2 text-[color:var(--color-ink)]';
const NOTE = 'py-8 text-center text-sm text-[color:var(--color-ink-muted)]';

export function MatchingStatus({ facilityId }: { facilityId: string | null }) {
  // Tanpa namespace: translateApiError memanggil t.has('errors.*') dari akar.
  const t = useTranslations();
  const format = useFormatter();

  const { data, isPending, isError, error, refetch } = useApiQuery<CampaignsResponse>(
    ['dashboard-campaigns'],
    CAMPAIGNS_PATH,
  );

  // Label transien, bukan bagian DonorCampaign: respons endpoint tidak memuat status,
  // jadi setelah reload label ini kosong sampai event berikutnya datang.
  const [requestStatuses, setRequestStatuses] = useState<Record<string, string>>({});

  // Dua-duanya membaca ulang, bukan menghitung di klien: payload tidak menyebut jenjang,
  // dan endpoint hanya memulangkan kampanye aktif sehingga refetch-lah yang membuat
  // daftarnya jujur saat permintaan selesai.
  useFacilityChannel(facilityId, {
    onDonorResponded: () => {
      void refetch();
    },
    onRequestStatus: ({ request_id, status }) => {
      setRequestStatuses((prev) => ({ ...prev, [request_id]: status }));
      void refetch();
    },
  });

  const kilometers = (meters: number) =>
    format.number(meters / 1000, { style: 'unit', unit: 'kilometer', maximumFractionDigits: 1 });

  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-[color:var(--color-ink-strong)]">
        {t('dashboard.matching.heading')}
      </h2>
      <p className="mt-1 text-sm text-[color:var(--color-ink-muted)]">{t('dashboard.matching.description')}</p>

      <div className="mt-4">
        {isPending ? (
          <p className={NOTE}>{t('dashboard.matching.loading')}</p>
        ) : isError ? (
          <p role="alert" className="py-8 text-center text-sm text-[color:var(--color-ink-soft)]">
            {translateApiError(error.body, t).summary}
          </p>
        ) : data.data.length === 0 ? (
          <p className={NOTE}>{t('dashboard.matching.empty')}</p>
        ) : (
          <ul className="divide-y divide-border">
            {data.data.map((campaign) => {
              const requestStatus = requestStatuses[campaign.blood_request_id];
              const statusKey = `dashboard.matching.status.${requestStatus}`;

              return (
                <li key={campaign.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                    <span className="font-medium text-[color:var(--color-ink-strong)]">
                      {t('dashboard.matching.currentRadius', { radius: kilometers(campaign.current_radius_meters) })}
                    </span>
                    <span className="text-xs text-[color:var(--color-ink-muted)]">
                      {t('dashboard.matching.startedAt', {
                        time: format.dateTime(new Date(campaign.started_at), { dateStyle: 'medium', timeStyle: 'short' }),
                      })}
                    </span>
                  </div>
                  {requestStatus !== undefined && t.has(statusKey) && (
                    <p role="status" className="mt-1 text-xs text-[color:var(--color-ink-muted)]">
                      {t('dashboard.matching.requestStatus', { status: t(statusKey) })}
                    </p>
                  )}

                  {campaign.stages.length === 0 ? (
                    <p className="mt-3 text-sm text-[color:var(--color-ink-muted)]">{t('dashboard.matching.noStages')}</p>
                  ) : (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full min-w-[28rem] border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className={HEAD}>{t('dashboard.matching.column.stage')}</th>
                            <th className={HEAD}>{t('dashboard.matching.column.contacted')}</th>
                            <th className={HEAD}>{t('dashboard.matching.column.accepted')}</th>
                            <th className={HEAD}>{t('dashboard.matching.column.declined')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {campaign.stages.map((stage) => {
                            const isCurrent = stage.radius_meters === campaign.current_radius_meters;

                            return (
                              <tr
                                key={stage.radius_meters}
                                aria-current={isCurrent ? 'true' : undefined}
                                className="border-b border-border"
                              >
                                <td className={CELL}>
                                  <span className={isCurrent ? 'font-medium text-[color:var(--color-ink-strong)]' : undefined}>
                                    {kilometers(stage.radius_meters)}
                                  </span>
                                  {isCurrent && (
                                    <span className="ml-2 text-xs text-[color:var(--color-ink-muted)]">
                                      {t('dashboard.matching.currentStage')}
                                    </span>
                                  )}
                                </td>
                                <td className={CELL}>{format.number(stage.contacted)}</td>
                                <td className={CELL}>{format.number(stage.accepted)}</td>
                                <td className={CELL}>{format.number(stage.declined)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="font-medium text-[color:var(--color-ink-strong)]">
                            <td className="px-3 py-2">{t('dashboard.matching.total')}</td>
                            <td className="px-3 py-2">{format.number(campaign.totals.contacted)}</td>
                            <td className="px-3 py-2">{format.number(campaign.totals.accepted)}</td>
                            <td className="px-3 py-2">{format.number(campaign.totals.declined)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
