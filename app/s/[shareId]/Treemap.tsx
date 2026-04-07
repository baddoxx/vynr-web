'use client';

import { useState, useMemo } from 'react';
import type { ShareEntry } from '@/lib/share-api';
import { squarify, type TreemapItem } from '@/lib/treemap-layout';
import {
  wineTypeColor,
  wineTypeTint,
  wineTypeHoverTint,
  wineTypeBorder,
  dominantWineType,
} from '@/lib/treemap-colors';

// ─── Grouping ────────────────────────────────────────────────────────────────

interface RegionGroup {
  label: string;
  entries: ShareEntry[];
  dominantType: string | undefined;
}

function groupByRegion(entries: ShareEntry[]): RegionGroup[] {
  const order: string[] = [];
  const map = new Map<string, ShareEntry[]>();

  for (const entry of entries) {
    const key = entry.region ?? entry.country ?? 'Unknown';
    if (!map.has(key)) {
      order.push(key);
      map.set(key, []);
    }
    map.get(key)!.push(entry);
  }

  return order.map((label) => {
    const entries = map.get(label)!;
    return {
      label,
      entries,
      dominantType: dominantWineType(entries.map((e) => e.wineType)),
    };
  });
}

// ─── Label sizing ────────────────────────────────────────────────────────────

const MIN_LABEL_DIM = 60;
const MIN_COUNT_DIM = 40;

// ─── Tooltip ─────────────────────────────────────────────────────────────────

interface TooltipData {
  label: string;
  count: number;
  wines: string[];
  x: number;
  y: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface TreemapProps {
  entries: ShareEntry[];
  width?: number;
  height?: number;
}

export function Treemap({ entries, width = 600, height = 400 }: TreemapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const groups = useMemo(() => groupByRegion(entries), [entries]);

  const items: TreemapItem[] = useMemo(
    () =>
      groups.map((g) => ({
        id: g.label,
        label: g.label,
        weight: g.entries.length,
        wineType: g.dominantType,
        subLabel: `${g.entries.length}`,
      })),
    [groups],
  );

  const rects = useMemo(() => squarify(items, width, height, 2), [items, width, height]);

  const groupMap = useMemo(() => {
    const m = new Map<string, RegionGroup>();
    for (const g of groups) m.set(g.label, g);
    return m;
  }, [groups]);

  function handleMouseEnter(rectId: string, svgX: number, svgY: number) {
    setHoveredId(rectId);
    const group = groupMap.get(rectId);
    if (group) {
      setTooltip({
        label: group.label,
        count: group.entries.length,
        wines: group.entries.map((e) => e.wineName),
        x: svgX,
        y: svgY,
      });
    }
  }

  function handleMouseLeave() {
    setHoveredId(null);
    setTooltip(null);
  }

  if (rects.length === 0) return null;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="auto"
        style={{
          display: 'block',
          borderRadius: 10,
          border: '1px solid var(--atlas-card-stroke)',
          background: 'var(--atlas-bg)',
          overflow: 'hidden',
        }}
        role="img"
        aria-label={`Treemap of ${entries.length} wines across ${groups.length} regions`}
      >
        {rects.map((r) => {
          const isHovered = hoveredId === r.item.id;
          const wt = r.item.wineType ?? 'unknown';
          const showLabel = Math.min(r.width, r.height) >= MIN_LABEL_DIM;
          const showCount = Math.min(r.width, r.height) >= MIN_COUNT_DIM;

          // Font sizes scale with tile area, clamped
          const labelSize = Math.max(10, Math.min(14, Math.sqrt(r.width * r.height) / 8));
          const countSize = Math.max(8, labelSize - 2);

          return (
            <g
              key={r.item.id}
              onMouseEnter={() =>
                handleMouseEnter(r.item.id, r.x + r.width / 2, r.y + r.height / 2)
              }
              onMouseLeave={handleMouseLeave}
              style={{ cursor: 'default' }}
            >
              {/* Tile fill */}
              <rect
                x={r.x}
                y={r.y}
                width={r.width}
                height={r.height}
                rx={4}
                ry={4}
                fill={isHovered ? wineTypeHoverTint(wt) : wineTypeTint(wt)}
                stroke={wineTypeBorder(wt)}
                strokeWidth={1}
                style={{ transition: 'fill 0.12s ease' }}
              />

              {/* Region label */}
              {showLabel && (
                <text
                  x={r.x + r.width / 2}
                  y={r.y + r.height / 2 - (showCount ? countSize * 0.4 : 0)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={wineTypeColor(wt)}
                  fontSize={labelSize}
                  fontWeight={500}
                  fontFamily="'Avenir Next', 'Avenir', 'Nunito Sans', 'Trebuchet MS', sans-serif"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {r.item.label}
                </text>
              )}

              {/* Wine count */}
              {showCount && showLabel && (
                <text
                  x={r.x + r.width / 2}
                  y={r.y + r.height / 2 + labelSize * 0.7}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={wineTypeColor(wt)}
                  fontSize={countSize}
                  fontWeight={400}
                  fontFamily="'Avenir Next', 'Avenir', 'Nunito Sans', 'Trebuchet MS', sans-serif"
                  opacity={0.6}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {r.item.weight === 1 ? '1 wine' : `${r.item.weight} wines`}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: `${(tooltip.x / width) * 100}%`,
            top: `${(tooltip.y / height) * 100}%`,
            transform: 'translate(-50%, -110%)',
            background: 'var(--atlas-card)',
            border: '1px solid var(--atlas-card-stroke)',
            borderRadius: 8,
            padding: '10px 14px',
            maxWidth: 220,
            pointerEvents: 'none',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(61, 53, 40, 0.10)',
          }}
        >
          <div
            style={{
              fontSize: '0.78rem',
              fontWeight: 600,
              color: 'var(--atlas-text)',
              marginBottom: 4,
            }}
          >
            {tooltip.label}
          </div>
          <div
            style={{
              fontSize: '0.68rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--atlas-text-placeholder)',
              marginBottom: 6,
            }}
          >
            {tooltip.count} {tooltip.count === 1 ? 'wine' : 'wines'}
          </div>
          <div
            style={{
              fontSize: '0.72rem',
              color: 'var(--atlas-text-secondary)',
              lineHeight: 1.5,
            }}
          >
            {tooltip.wines.slice(0, 6).map((name, i) => (
              <div key={i}>{name}</div>
            ))}
            {tooltip.wines.length > 6 && (
              <div style={{ fontStyle: 'italic', opacity: 0.7, marginTop: 2 }}>
                +{tooltip.wines.length - 6} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
