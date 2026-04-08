'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { squarify, type TreemapItem } from '@/lib/treemap-layout';
import type { AtlasNode } from '@/lib/atlas';

// ─── Neutral limestone palette ─────────────────────────────────────────────

const FILL = 'rgba(200, 188, 170, 0.15)';
const FILL_HOVER = 'rgba(200, 188, 170, 0.25)';
const BORDER = 'rgba(200, 188, 170, 0.30)';
const LABEL_COLOR = '#6B614E';

// ─── Font family ──────────────────────────────────────────────────────────

const FONT_FAMILY = 'var(--font-sans)';

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
  labelHidden: boolean;
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

  // Height policy: square-ish on mobile, 3:2 on desktop, scales with node count
  const isMobile = measuredWidth > 0 && measuredWidth < 480;
  const ratio = isMobile ? 1 : 3 / 2;
  const rawHeight = measuredWidth / ratio;
  const minH = isMobile ? 300 : 300;
  const baseMaxH = isMobile ? 550 : 650;
  const nodeBonus = Math.min(350, Math.max(0, (nodes.length - 8) * 20));
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

  const handleMouseEnter = useCallback((id: string, svgX: number, svgY: number, labelHidden: boolean) => {
    if (!canHover) return;
    setHoveredId(id);
    const node = nodeMap.get(id);
    if (!node) return;
    const childCount = node.childIds.length;
    const hint = childCount > 0
      ? `${childCount} ${node.childLevelHint ? node.childLevelHint.toLowerCase() + (childCount !== 1 ? 's' : '') : 'regions'}`
      : 'Appellation';
    setTooltip({ label: node.displayName, hint, x: svgX, y: svgY, labelHidden });
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
          borderRadius: 6,
          background: 'var(--atlas-bg)',
          overflow: 'hidden',
        }}
        role="group"
        aria-label={ariaLabel}
      >
        {rects.map((r) => {
          const isHovered = hoveredId === r.item.id;
          const cx = r.x + r.width / 2;
          const cy = r.y + r.height / 2;
          const hideLabel = Math.min(r.width, r.height) < 18;
          const node = nodeMap.get(r.item.id);
          const isContainer = node != null && node.childIds.length > 0;

          return (
            <g
              key={r.item.id}
              onClick={() => handleClick(r.item.id)}
              onMouseEnter={() => handleMouseEnter(r.item.id, cx, cy, hideLabel)}
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

              {/* foreignObject label with CSS word-wrapping */}
              {!hideLabel && (
                <foreignObject x={r.x + 2} y={r.y + 2} width={r.width - 4} height={r.height - 4}>
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '2px 4px',
                      fontSize: `${Math.max(10, Math.min(16, Math.sqrt(r.width * r.height) / 7))}px`,
                      fontWeight: isContainer ? 600 : 400,
                      fontFamily: FONT_FAMILY,
                      color: LABEL_COLOR,
                      textAlign: 'center',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      overflow: 'hidden',
                      lineHeight: '1.2',
                      pointerEvents: 'none',
                      userSelect: 'none',
                      boxSizing: 'border-box' as const,
                    }}
                  >
                    {r.item.label}
                  </div>
                </foreignObject>
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
            transform: tooltip.y / computedHeight < 0.2
              ? 'translate(-50%, 10%)'
              : 'translate(-50%, -110%)',
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
          {tooltip.labelHidden && (
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--atlas-text)' }}>
              {tooltip.label}
            </div>
          )}
          <div style={{ fontSize: '0.68rem', color: 'var(--atlas-text-placeholder)', marginTop: tooltip.labelHidden ? 2 : 0 }}>
            {tooltip.hint}
          </div>
        </div>
      )}
    </div>
  );
}
