// patient-management-app/frontend/src/components/analytics/DistributionMap.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { formatNumber } from "./chartTheme";
import {
  aggregateByProvince,
  provinceLabelIndex,
  regenciesForProvince,
  normalizeProvince,
  MERGED_PROVINCES_NOTE,
} from "../../utils/regionMatch";
import { toTitleCase } from "../../utils/helpers";

const W = 760;
const H = 380;
const RAMP = ["#cffafe", "#67e8f9", "#22d3ee", "#0891b2", "#155e75"];
const NO_DATA = "#e8edf3";

const colorFor = (count, max) => {
  if (!count) return NO_DATA;
  const step = Math.floor((count / max) * RAMP.length);
  return RAMP[Math.min(RAMP.length - 1, step)];
};

const DistributionMap = ({ data = [], regencyByProvince = [] }) => {
  const [features, setFeatures] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState(null); // normalized key
  const [hover, setHover] = useState(null); // { title, count, x, y }
  const containerRef = useRef(null);

  useEffect(() => {
    let alive = true;
    import("../../assets/indonesia-provinces.json")
      .then((mod) => {
        if (alive) setFeatures((mod.default || mod).features);
      })
      .catch(() => {
        if (alive) setLoadError(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const counts = useMemo(() => aggregateByProvince(data), [data]);
  const labels = useMemo(() => provinceLabelIndex(data), [data]);
  const total = useMemo(
    () => [...counts.values()].reduce((sum, n) => sum + n, 0),
    [counts]
  );
  const max = useMemo(() => Math.max(0, ...counts.values()), [counts]);

  const paths = useMemo(() => {
    if (!features) return [];
    const collection = { type: "FeatureCollection", features };
    const projection = geoMercator().fitExtent(
      [
        [14, 14],
        [W - 14, H - 14],
      ],
      collection
    );
    const path = geoPath(projection);
    return features.map((feature) => {
      const key = normalizeProvince(feature.properties.name);
      return {
        name: feature.properties.name,
        key,
        d: path(feature),
        count: counts.get(key) || 0,
      };
    });
  }, [features, counts]);

  const topProvinces = useMemo(
    () =>
      [...counts.entries()]
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
    [counts]
  );

  const regencies = useMemo(
    () => (selected ? regenciesForProvince(regencyByProvince, selected).slice(0, 8) : []),
    [regencyByProvince, selected]
  );
  const selectedCount = selected ? counts.get(selected) || 0 : 0;
  const maxRegency = regencies.length ? regencies[0].count : 0;

  const displayName = (key) => {
    if (labels.has(key)) return toTitleCase(labels.get(key));
    const raw = paths.find((p) => p.key === key)?.name;
    return raw ? toTitleCase(raw) : toTitleCase(key);
  };

  const handleMove = (event) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setHover((prev) =>
      prev
        ? { ...prev, x: event.clientX - rect.left, y: event.clientY - rect.top }
        : prev
    );
  };

  if (loadError) {
    return (
      <p className="py-10 text-center text-sm text-gray-500">
        Gagal memuat data peta. Muat ulang halaman untuk mencoba lagi.
      </p>
    );
  }

  if (!features) {
    return <div className="h-[380px] animate-pulse rounded-xl bg-gray-200" />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr,1fr]">
      {/* Peta */}
      <div className="relative" ref={containerRef}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="img"
          aria-label="Peta sebaran pasien per provinsi di Indonesia"
          onMouseLeave={() => setHover(null)}
        >
          {paths.map((p) => {
            const isSel = selected === p.key;
            return (
              <path
                key={p.name}
                d={p.d}
                fill={colorFor(p.count, max)}
                stroke={isSel ? "#0e7490" : "#ffffff"}
                strokeWidth={isSel ? 1.6 : 0.7}
                className="cursor-pointer transition-[fill] duration-150 outline-none focus-visible:stroke-primary-700"
                style={{ filter: isSel ? "drop-shadow(0 1px 3px rgb(8 145 178 / 0.45))" : undefined }}
                tabIndex={0}
                role="button"
                aria-label={`${toTitleCase(p.name)}: ${p.count} pasien`}
                onMouseEnter={(e) => {
                  if (!containerRef.current) return;
                  const rect = containerRef.current.getBoundingClientRect();
                  setHover({
                    title: toTitleCase(p.name),
                    count: p.count,
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  });
                }}
                onMouseMove={handleMove}
                onFocus={(e) => {
                  if (!containerRef.current) return;
                  const rect = containerRef.current.getBoundingClientRect();
                  const box = e.target.getBoundingClientRect();
                  setHover({
                    title: toTitleCase(p.name),
                    count: p.count,
                    x: box.left - rect.left + box.width / 2,
                    y: box.top - rect.top,
                  });
                }}
                onBlur={() => setHover(null)}
                onClick={() => setSelected((prev) => (prev === p.key ? null : p.key))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected((prev) => (prev === p.key ? null : p.key));
                  }
                }}
              />
            );
          })}
        </svg>

        {/* Tooltip kaca */}
        {hover && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+10px)] whitespace-nowrap rounded-xl border border-white/60 bg-white/85 px-3 py-1.5 shadow-card ring-1 ring-gray-900/5 backdrop-blur-md"
            style={{ left: hover.x, top: hover.y }}
            role="status"
          >
            <p className="text-xs font-semibold text-gray-900">{hover.title}</p>
            <p className="text-xs text-gray-500">
              {formatNumber(hover.count)} pasien
              {total > 0 ? ` · ${Math.round((hover.count / total) * 100)}%` : ""}
            </p>
          </div>
        )}

        {/* Legenda */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: NO_DATA }} aria-hidden="true" />
            Belum ada
          </span>
          <span className="flex items-center gap-0.5" aria-hidden="true">
            {RAMP.map((c) => (
              <span key={c} className="h-3 w-5 rounded-sm" style={{ backgroundColor: c }} />
            ))}
          </span>
          <span>
            {formatNumber(0)} → {formatNumber(max)} pasien
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500">{MERGED_PROVINCES_NOTE}</p>
      </div>

      {/* Panel detail */}
      <div className="flex flex-col rounded-xl border border-gray-100 bg-white/60 p-4">
        {selected ? (
          <>
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {displayName(selected)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatNumber(selectedCount)} pasien
                  {total > 0 ? ` · ${Math.round((selectedCount / total) * 100)}% nasional` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-50"
              >
                Semua provinsi
              </button>
            </div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Top Kabupaten/Kota
            </p>
            {regencies.length > 0 ? (
              <ul className="space-y-2 overflow-y-auto">
                {regencies.map((r) => (
                  <li key={r.kabupaten}>
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="truncate text-gray-700">{toTitleCase(r.kabupaten)}</span>
                      <span className="shrink-0 font-semibold text-gray-900">
                        {formatNumber(r.count)}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-gray-100">
                      <div
                        className="h-1.5 rounded-full bg-primary-600"
                        style={{ width: `${maxRegency ? Math.max(4, (r.count / maxRegency) * 100) : 4}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500">
                Belum ada data kabupaten untuk provinsi ini.
              </p>
            )}
          </>
        ) : (
          <>
            <p className="mb-1 text-sm font-semibold text-gray-900">Sebaran Nasional</p>
            <p className="mb-3 text-xs text-gray-500">
              Klik provinsi pada peta untuk melihat distribusi kabupaten/kotanya.
            </p>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Top Provinsi
            </p>
            {topProvinces.length > 0 ? (
              <ul className="space-y-2">
                {topProvinces.map((p) => (
                  <li key={p.key}>
                    <button
                      type="button"
                      onClick={() => setSelected(p.key)}
                      className="group flex w-full items-baseline justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-primary-50"
                    >
                      <span className="truncate text-gray-700 group-hover:text-primary-800">
                        {displayName(p.key)}
                      </span>
                      <span className="shrink-0 font-semibold text-gray-900">
                        {formatNumber(p.count)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500">Belum ada data pasien.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DistributionMap;