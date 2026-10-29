'use client';

import dynamic from 'next/dynamic';
import { useQueries } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { apiFetch, ApiFailure } from '@/lib/api/client';
import { useApiCursorPages, useApiQuery } from '@/lib/api/hooks';
import { onUnauthenticated } from '@/lib/api/on-unauthenticated';
import { translateApiError } from '@/lib/errors/translate-api-error';
import { Card } from '@/components/ui/card';
import { GlassPanel } from '@/components/ui/glass-panel';
import { COMPONENTS, type BloodBatchPage, type ComponentValue } from '@/lib/api/blood-batches';
import {
  FACILITY_MAP_MAX_PAGES,
  FACILITY_MAP_PER_PAGE,
  buildFacilityPath,
  type FacilityPin,
  type FacilityRow,
} from '@/lib/api/facilities';
import {
  OPEN_TRANSFER_STATUSES,
  TRANSFER_PER_PAGE,
  buildOpenTransferPath,
  mergeTransfers,
  type StockTransfer,
  type StockTransferPage,
} from '@/lib/api/stock-transfers';
import type { LatLng, TransferLine } from './stock-map';

const StockMap = dynamic(() => import('@/components/map/stock-map'), {
  ssr: false,
  loading: () => <Card className="h-[28rem] animate-pulse" />,
});

// Stok SENDIRI: GET /blood-batches sudah dibatasi backend ke fasilitas pemegang
// token. Hanya unit released (status yang sah untuk stok siap pakai), satu
// halaman maksimum, terbaru dulu. Tidak pernah ditelusuri ke halaman berikutnya.
const OWN_STOCK_PER_PAGE = 100;
const OWN_STOCK_PATH = `/blood-batches?${new URLSearchParams({
  'filter[status]': 'released',
  per_page: String(OWN_STOCK_PER_PAGE),
  sort: '-created_at',
}).toString()}`;

const MUTED = 'text-sm text-[color:var(--color-ink-muted)]';
// Bukan text-base: token --color-base membuat Tailwind membacanya sebagai WARNA.
const HEADING = 'font-display text-lg font-semibold text-[color:var(--color-ink-strong)]';

function coords(facility: FacilityRow | undefined): LatLng | null {
  return facility && facility.latitude !== null && facility.longitude !== null
    ? [facility.latitude, facility.longitude]
    : null;
}

export function StockMapIsland({ selfFacilityId }: { selfFacilityId: string | null }) {
  // Tanpa namespace: translateApiError memanggil t.has('errors.*') dari akar.
  const t = useTranslations();

  const facilities = useApiCursorPages<FacilityRow>(
    ['map', 'facilities'],
    (cursor) => buildFacilityPath({}, cursor, FACILITY_MAP_PER_PAGE),
    FACILITY_MAP_MAX_PAGES,
  );

  const transferQueries = useQueries({
    queries: OPEN_TRANSFER_STATUSES.map((status) => ({
      queryKey: ['map', 'stock-transfers', status],
      queryFn: async () => {
        try {
          return await apiFetch<StockTransferPage>(buildOpenTransferPath(status));
        } catch (error) {
          if (error instanceof ApiFailure && error.status === 401) await onUnauthenticated();
          throw error;
        }
      },
    })),
  });

  const stock = useApiQuery<BloodBatchPage>(['map', 'own-stock'], OWN_STOCK_PATH);

  if (facilities.isPending) {
    return <Card className="mt-6 h-[28rem] animate-pulse" />;
  }

  if (facilities.isError) {
    return (
      <p role="alert" className="mt-6 text-sm text-[color:var(--color-ink-soft)]">
        {translateApiError(facilities.error.body, t).summary}
      </p>
    );
  }

  const rows = facilities.data.items;
  const byId = new Map(rows.map((row) => [row.id, row]));
  // selfFacilityId hanya presentasi: warna marker dan pemusatan.
  const pins: FacilityPin[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    isSelf: row.id === selfFacilityId,
  }));
  const located = pins.filter((pin) => pin.latitude !== null && pin.longitude !== null);
  const missing = pins.filter((pin) => pin.latitude === null || pin.longitude === null);

  const selfCoords = coords(selfFacilityId === null ? undefined : byId.get(selfFacilityId));
  const center: LatLng | null =
    selfCoords ??
    (located.length > 0
      ? [
          located.reduce((sum, pin) => sum + (pin.latitude as number), 0) / located.length,
          located.reduce((sum, pin) => sum + (pin.longitude as number), 0) / located.length,
        ]
      : null);

  const transfersReady = transferQueries.every((q) => q.isSuccess);
  const transferError = transferQueries.find((q) => q.isError)?.error;
  const transfers = transfersReady ? mergeTransfers(transferQueries.map((q) => q.data!.data)) : [];
  const transfersTruncated = transferQueries.some((q) => q.data?.meta.has_more);

  const lines: TransferLine[] = transfers.flatMap((transfer) => {
    const from = coords(byId.get(transfer.from_facility_id));
    const to = coords(byId.get(transfer.to_facility_id));
    return from && to ? [{ id: transfer.id, from, to }] : [];
  });

  const nameOf = (id: string) => byId.get(id)?.name ?? t('map.transfers.unknownFacility');

  function describe(transfer: StockTransfer): string {
    if (transfer.to_facility_id === selfFacilityId) {
      return t('map.transfers.incoming', { facility: nameOf(transfer.from_facility_id) });
    }
    if (transfer.from_facility_id === selfFacilityId) {
      return t('map.transfers.outgoing', { facility: nameOf(transfer.to_facility_id) });
    }
    return t('map.transfers.between', {
      from: nameOf(transfer.from_facility_id),
      to: nameOf(transfer.to_facility_id),
    });
  }

  const stockCounts = new Map<ComponentValue, number>();
  for (const unit of stock.data?.data ?? []) {
    stockCounts.set(unit.component, (stockCounts.get(unit.component) ?? 0) + 1);
  }

  const stockSummary = stock.isPending ? (
    <p className={MUTED}>{t('map.loading')}</p>
  ) : stock.isError ? (
    <p role="alert" className="text-sm text-[color:var(--color-ink-soft)]">
      {translateApiError(stock.error.body, t).summary}
    </p>
  ) : stock.data.data.length === 0 ? (
    <p className={MUTED}>{t('map.stock.empty')}</p>
  ) : (
    <>
      <ul className="flex flex-col gap-1 text-sm text-[color:var(--color-ink)]">
        {COMPONENTS.filter((c) => stockCounts.has(c)).map((component) => (
          <li key={component} className="flex justify-between gap-4">
            <span>{t(`dashboard.component.${component}`)}</span>
            <span className="tabular-nums">{t('map.stock.units', { count: stockCounts.get(component) ?? 0 })}</span>
          </li>
        ))}
      </ul>
      {/* Peringatan HANYA bila memang terpotong; daftar lengkap = angkanya total. */}
      {stock.data.meta.has_more ? (
        <p className={`mt-2 ${MUTED}`}>{t('map.stock.partial', { count: stock.data.data.length })}</p>
      ) : null}
      {/* Status released, BUKAN definisi "tersedia" backend (NearbyStockQuery). */}
      <p className={`mt-2 ${MUTED}`}>{t('map.stock.note')}</p>
    </>
  );

  function renderPopup(pin: FacilityPin) {
    if (pin.isSelf) {
      return (
        <div className="flex min-w-48 flex-col gap-2 text-[color:var(--color-base)]">
          <strong>{pin.name}</strong>
          <span>{t('map.selfLabel')}</span>
          {stockSummary}
        </div>
      );
    }

    // Fasilitas LAIN: nama dan transfer dengannya saja. Tidak ada angka stok --
    // datanya memang tidak ada (endpoint agregat lintas fasilitas belum ada).
    const withPin = transfers.filter(
      (transfer) => transfer.from_facility_id === pin.id || transfer.to_facility_id === pin.id,
    );

    return (
      <div className="flex min-w-48 flex-col gap-2 text-[color:var(--color-base)]">
        <strong>{pin.name}</strong>
        {withPin.length === 0 ? (
          <span>{t('map.popup.noTransfers')}</span>
        ) : (
          <ul className="flex flex-col gap-1">
            {withPin.map((transfer) => (
              <li key={transfer.id}>
                {describe(transfer)} · {t(`map.transfers.status.${transfer.status}`)}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex flex-col gap-4">
        {center === null ? (
          <GlassPanel className="p-6">
            <p className={MUTED}>{t('map.noCoordinates')}</p>
          </GlassPanel>
        ) : (
          <StockMap
            center={center}
            pins={pins}
            lines={lines}
            renderPopup={renderPopup}
            label={t('map.regionLabel')}
          />
        )}
        {facilities.data.truncated ? (
          <p className={MUTED}>{t('map.truncatedFacilities', { count: rows.length })}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-6">
        <GlassPanel className="p-6">
          <h2 className={HEADING}>{t('map.stock.heading')}</h2>
          <div className="mt-3">{stockSummary}</div>
        </GlassPanel>

        <GlassPanel className="p-6">
          <h2 className={HEADING}>{t('map.transfers.heading')}</h2>
          <div className="mt-3">
            {transferError ? (
              <p role="alert" className="text-sm text-[color:var(--color-ink-soft)]">
                {transferError instanceof ApiFailure
                  ? translateApiError(transferError.body, t).summary
                  : t('errors.unknown')}
              </p>
            ) : !transfersReady ? (
              <p className={MUTED}>{t('map.loading')}</p>
            ) : transfers.length === 0 ? (
              <p className={MUTED}>{t('map.transfers.empty')}</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm text-[color:var(--color-ink)]">
                {transfers.map((transfer) => (
                  <li key={transfer.id}>
                    <div>{describe(transfer)}</div>
                    <div className="text-xs text-[color:var(--color-ink-muted)]">
                      {t(`map.transfers.status.${transfer.status}`)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {transfersTruncated ? (
              <p className={`mt-2 ${MUTED}`}>{t('map.transfers.truncated', { count: TRANSFER_PER_PAGE })}</p>
            ) : null}
          </div>
        </GlassPanel>

        <GlassPanel className="p-6">
          <h2 className={HEADING}>{t('map.missing.heading')}</h2>
          <p className={`mt-1 ${MUTED}`}>{t('map.missing.count', { count: missing.length })}</p>
          {missing.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-1 text-sm text-[color:var(--color-ink)]">
              {missing.map((pin) => (
                <li key={pin.id}>{pin.name}</li>
              ))}
            </ul>
          ) : null}
        </GlassPanel>
      </div>
    </div>
  );
}
