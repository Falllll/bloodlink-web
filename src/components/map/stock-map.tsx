'use client';

import type { ReactNode } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { FacilityPin } from '@/lib/api/facilities';

export type LatLng = [number, number];
export type TransferLine = { id: string; from: LatLng; to: LatLng };

// divIcon dari token, bukan L.Icon.Default: ikon PNG bawaan Leaflet dicari relatif
// terhadap CSS-nya dan hilang di bundler modern. Outline terang supaya titik abu
// fasilitas lain tidak tenggelam di atas jalan dan gedung abu-abu tile OSM.
function pinIcon(self: boolean): L.DivIcon {
  const size = self ? 18 : 14;
  const fill = self ? 'var(--color-status-issued)' : 'var(--color-ink-muted)';

  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:9999px;background:${fill};border:2px solid var(--color-ink-strong);box-shadow:0 0 0 1px rgba(0,0,0,0.45)"></span>`,
  });
}

const SELF_ICON = pinIcon(true);
const OTHER_ICON = pinIcon(false);

export default function StockMap({
  center,
  pins,
  lines,
  renderPopup,
  label,
}: {
  center: LatLng;
  pins: FacilityPin[];
  lines: TransferLine[];
  renderPopup: (pin: FacilityPin) => ReactNode;
  label: string;
}) {
  return (
    <div role="region" aria-label={label} className="h-[28rem] overflow-hidden rounded-xl">
      <MapContainer center={center} zoom={12} scrollWheelZoom={false} className="h-full w-full">
        {/* Atribusi OSM WAJIB terlihat -- syarat lisensi tile, bukan hiasan. */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {lines.map((line) => (
          <Polyline
            key={line.id}
            positions={[line.from, line.to]}
            pathOptions={{ color: 'var(--color-status-reserved)', weight: 3, opacity: 0.9 }}
          />
        ))}
        {pins.map((pin) =>
          pin.latitude === null || pin.longitude === null ? null : (
            <Marker
              key={pin.id}
              position={[pin.latitude, pin.longitude]}
              icon={pin.isSelf ? SELF_ICON : OTHER_ICON}
              zIndexOffset={pin.isSelf ? 1000 : 0}
            >
              <Popup>{renderPopup(pin)}</Popup>
            </Marker>
          ),
        )}
      </MapContainer>
    </div>
  );
}
