'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { squarify, type TreemapItem } from '@/lib/treemap-layout';
import { classifyLabel, generateMonogram } from '@/lib/tile-labels';
import type { AtlasNode } from '@/lib/atlas';

// ─── Neutral limestone palette ─────────────────────────────────────────────

const FILL = 'rgba(200, 188, 170, 0.15)';
const FILL_HOVER = 'rgba(200, 188, 170, 0.25)';
const BORDER = 'rgba(200, 188, 170, 0.30)';
const LABEL_COLOR = '#6B614E';

// ─── Font family constant ─────────────────────────────────────────────────

const FONT_FAMILY = "'Avenir Next', 'Avenir', 'Nunito Sans', 'Trebuchet MS', sans-serif";

// ─── ResizeObserver hook ───────────────────────────────────────────────────

function useContainerWidth(ref: React.RefObject<HTMLDivElement | null>): number {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const w = Math.round(entry.contentRect.width);
        setWidth((prev) => prev === w ? prev : w);
      }
    });
    observer.observe(el);
    setWidth(Math.round(el.clientWidth));

    return () => observer.disconnect();
  }, [ref]);

  return width;
}

// ─── Component ─────────────────────────────────────────────────────────────

interface AtlasTreemapViewProps {
  nodes: AtlasNode[];
  onNodeClick: (node: AtlasNode) => void;
  currentNode: AtlasNode | null;
}

interface TooltipData {
  label: string;
  hint: string;
  x: number;
  y: number;
}

export function AtlasTreemapView({ nodes, onNodeClick, currentNode }: AtlasTreemapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measuredWidth = useContainerWidth(containerRef);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    setCanHover(window.matchMedia('(hover: hover)').matches);
  }, []);

  // Height policy: 3:2 desktop, 4:3 mobile, scales with node count for dense views
  const isMobile = measuredWidth > 0 && measuredWidth < 480;
  const ratio = isMobile ? 4 / 3 : 3 / 2;
  const rawHeight = measuredWidth / ratio;
  const minH = isMobile ? 200 : 250;
  const baseMaxH = isMobile ? 400 : 500;
  const nodeBonus = Math.min(300, Math.max(0, (nodes.length - 10) * 15));
  const maxH = baseMaxH + nodeBonus;
  const computedHeight = Math.max(minH, Math.min(maxH, rawHeight));

  const items: TreemapItem[] = useMemo(
    () => nodes.map((n) => ({
      id: n.id,
      label: n.displayName,
      weight: n.treemapWeight ?? n.leafCount ?? 1,
    })),
    [nodes],
  );

  const rects = useMemo(
    () => measuredWidth > 0 ? squarify(items, measuredWidth, computedHeight, 2) : [],
    [items, measuredWidth, computedHeight],
  );

  const nodeMap = useMemo(() => {
    const m = new Map<string, AtlasNode>();
    for (const n of nodes) m.set(n.id, n);
    return m;
  }, [nodes]);

  const handleMouseEnter = useCallback((id: string, svgX: number, svgY: number) => {
    if (!canHover) return;
    setHoveredId(id);
    const node = nodeMap.get(id);
    if (!node) return;
    const childCount = node.childIds.length;
    const hint = childCount > 0
      ? `${childCount} ${node.childLevelHint ? node.childLevelHint.toLowerCase() + (childCount !== 1 ? 's' : '') : 'regions'}`
      : 'Appellation';
    setTooltip({ label: node.displayName, hint, x: svgX, y: svgY });
  }, [canHover, nodeMap]);

  const handleMouseLeave = useCallback(() => {
    setHoveredId(null);
    setTooltip(null);
  }, []);

  const handleClick = useCallback((id: string) => {
    const node = nodeMap.get(id);
    if (node) onNodeClick(node);
  }, [nodeMap, onNodeClick]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(id);
    }
  }, [handleClick]);

  const ariaLabel = useMemo(() => {
    if (!currentNode) {
      return `Wine Atlas — ${nodes.length} continents`;
    }
    return `${currentNode.displayName} — ${nodes.length} ${nodes.length === 1 ? 'region' : 'regions'}`;
  }, [nodes.length, currentNode]);

  if (measuredWidth === 0) {
    return <div ref={containerRef} style={{ width: '100%', minHeight: minH }} />;
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <svg
        viewBox={`0 0 ${measuredWidth} ${computedHeight}`}
        width="100%"
        height={computedHeight}
        style={{
          display: 'block',
          borderRadius: 10,
          border: '1px solid var(--atlas-card-stroke)',
          background: 'var(--atlas-bg)',
          overflow: 'hidden',
        }}
        role="group"
        aria-label={ariaLabel}
      >
        {rects.map((r) => {
          const isHovered = hoveredId === r.item.id;
          const labelSize = Math.max(10, Math.min(14, Math.sqrt(r.width * r.height) / 8));
          const cx = r.x + r.width / 2;
          const cy = r.y + r.height / 2;
          const mode = classifyLabel(r.width, r.height, r.item.label.length);
          const monogram = mode === 'monogram' ? generateMonogram(r.item.label) : '';

          return (
            <g
              key={r.item.id}
              onClick={() => handleClick(r.item.id)}
              onMouseEnter={() => handleMouseEnter(r.item.id, cx, cy)}
              onMouseLeave={handleMouseLeave}
              onKeyDown={(e) => handleKeyDown(e, r.item.id)}
              tabIndex={0}
              role="button"
              aria-label={r.item.label}
              style={{ cursor: 'pointer', outline: 'none' }}
            >
              {/* Tile fill */}
              <rect
                x={r.x}
                y={r.y}
                width={r.width}
                height={r.height}
                rx={4}
                ry={4}
                fill={isHovered ? FILL_HOVER : FILL}
                style={{ transition: 'fill 0.12s ease' }}
              />

              {/* Tile border */}
              <rect
                x={r.x}
                y={r.y}
                width={r.width}
                height={r.height}
                rx={4}
                ry={4}
                fill="none"
                stroke={BORDER}
                strokeWidth={1}
              />

              {/* Focus ring */}
              <rect
                x={r.x}
                y={r.y}
                width={r.width}
                height={r.height}
                rx={4}
                ry={4}
                fill="none"
                stroke="var(--atlas-tint)"
                strokeWidth={2}
                opacity={0}
                className="focus-ring"
                style={{ pointerEvents: 'none' }}
              />

              {/* Three-tier label rendering */}
              {mode === 'full' && (
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={LABEL_COLOR}
                  fontSize={labelSize}
                  fontWeight={500}
                  fontFamily={FONT_FAMILY}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {r.item.label}
                </text>
              )}
              {mode === 'vertical' && (
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={LABEL_COLOR}
                  fontSize={Math.max(9, labelSize - 1)}
                  fontWeight={500}
                  fontFamily={FONT_FAMILY}
                  transform={`rotate(-90 ${cx} ${cy})`}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {r.item.label}
                </text>
              )}
              {mode === 'monogram' && (
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={LABEL_COLOR}
                  fontSize={Math.max(9, labelSize - 2)}
                  fontWeight={700}
                  fontFamily={FONT_FAMILY}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {monogram}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip (desktop only) */}
      {tooltip && canHover && (
        <div
          style={{
            position: 'absolute',
            left: `${(tooltip.x / measuredWidth) * 100}%`,
            top: `${(tooltip.y / computedHeight) * 100}%`,
            transform: 'translate(-50%, -110%)',
            background: 'var(--atlas-card)',
            border: '1px solid var(--atlas-card-stroke)',
            borderRadius: 8,
            padding: '8px 12px',
            maxWidth: 200,
            pointerEvents: 'none',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(61, 53, 40, 0.10)',
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--atlas-text)' }}>
            {tooltip.label}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--atlas-text-placeholder)', marginTop: 2 }}>
            {tooltip.hint}
          </div>
        </div>
      )}
    </div>
  );
}
