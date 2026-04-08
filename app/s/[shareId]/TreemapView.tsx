'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { squarify, type TreemapItem } from '@/lib/treemap-layout';
import {
  wineTypeTint,
  wineTypeHoverTint,
  wineTypeColor,
  wineTypeBorder,
} from '@/lib/treemap-colors';
import { type CellarNode, type WineTypeSegment, isWineNode, canDrill } from '@/lib/cellar-tree';

// ─── Tint helpers (tolerate undefined wineType) ─────────────────────────────

const NEUTRAL = { r: 0x8a, g: 0x7d, b: 0x68 };

function nodeTint(wineType: string | undefined, opacity: number = 0.35): string {
  if (!wineType) return `rgba(${NEUTRAL.r}, ${NEUTRAL.g}, ${NEUTRAL.b}, 0.08)`;
  return wineTypeTint(wineType, opacity);
}

function nodeHoverTint(wineType: string | undefined): string {
  if (!wineType) return `rgba(${NEUTRAL.r}, ${NEUTRAL.g}, ${NEUTRAL.b}, 0.15)`;
  return wineTypeTint(wineType, 0.45);
}

function nodeColor(wineType: string | undefined): string {
  if (!wineType) return '#6B614E';
  return wineTypeColor(wineType);
}

function nodeBorder(wineType: string | undefined): string {
  if (!wineType) return `rgba(${NEUTRAL.r}, ${NEUTRAL.g}, ${NEUTRAL.b}, 0.25)`;
  return wineTypeBorder(wineType);
}

// ─── Wine tile label formatter ──────────────────────────────────────────────

function wineTileLabel(node: CellarNode): { primary: string; secondary?: string } {
  const entry = node.entry;
  if (!entry) return { primary: node.label };
  // Wine name is primary; producer as secondary when different
  return {
    primary: entry.wineName,
    secondary: entry.producer && entry.producer !== entry.wineName ? entry.producer : undefined,
  };
}

// ─── Tooltip data ───────────────────────────────────────────────────────────

interface TooltipData {
  content: { primary: string; secondary?: string };
  x: number;
  y: number;
}

// ─── Font family constant ───────────────────────────────────────────────────

const FONT_FAMILY = "'Avenir Next', 'Avenir', 'Nunito Sans', 'Trebuchet MS', sans-serif";

// ─── ResizeObserver hook ────────────────────────────────────────────────────

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

// ─── Component ──────────────────────────────────────────────────────────────

interface TreemapViewProps {
  nodes: CellarNode[];
  isTerminalPath: boolean;
  hoveredNodeId: string | null;
  onNodeClick: (node: CellarNode) => void;
  onNodeHover: (nodeId: string | null) => void;
  currentNode: CellarNode | null;
}

export function TreemapView({
  nodes,
  isTerminalPath,
  hoveredNodeId,
  onNodeClick,
  onNodeHover,
  currentNode,
}: TreemapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measuredWidth = useContainerWidth(containerRef);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [canHover, setCanHover] = useState(false);

  // Detect hover capability
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
      label: n.label,
      weight: n.weight,
      wineType: n.wineType,
    })),
    [nodes],
  );

  const rects = useMemo(
    () => measuredWidth > 0 ? squarify(items, measuredWidth, computedHeight, 2) : [],
    [items, measuredWidth, computedHeight],
  );

  // Build a lookup from id to CellarNode for click handling
  const nodeMap = useMemo(() => {
    const m = new Map<string, CellarNode>();
    for (const n of nodes) m.set(n.id, n);
    return m;
  }, [nodes]);

  const handleMouseEnter = useCallback((id: string, svgX: number, svgY: number) => {
    if (!canHover) return;
    onNodeHover(id);
    const node = nodeMap.get(id);
    if (!node) return;

    if (isWineNode(node) && node.entry) {
      setTooltip({
        content: {
          primary: node.entry.wineName,
          secondary: [node.entry.producer, node.entry.vintage].filter(Boolean).join(' \u00B7 '),
        },
        x: svgX,
        y: svgY,
      });
    } else {
      setTooltip({
        content: {
          primary: node.label,
          secondary: `${node.weight} ${node.weight === 1 ? 'wine' : 'wines'}`,
        },
        x: svgX,
        y: svgY,
      });
    }
  }, [canHover, onNodeHover, nodeMap]);

  const handleMouseLeave = useCallback(() => {
    onNodeHover(null);
    setTooltip(null);
  }, [onNodeHover]);

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

  // Aria label for the treemap
  const ariaLabel = useMemo(() => {
    if (!currentNode) {
      return `${nodes.length} ${nodes.length === 1 ? 'country' : 'countries'}`;
    }
    if (isTerminalPath) {
      return `${nodes.length} ${nodes.length === 1 ? 'wine' : 'wines'} in ${currentNode.label}`;
    }
    return `${nodes.length} ${nodes.length === 1 ? 'region' : 'regions'} in ${currentNode.label}`;
  }, [nodes.length, currentNode, isTerminalPath]);

  if (measuredWidth === 0) {
    // Render container for measurement, content will appear on next frame
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
          const isHovered = hoveredNodeId === r.item.id;
          const wt = r.item.wineType;
          const isWine = isTerminalPath;

          const labelSize = Math.max(10, Math.min(16, Math.sqrt(r.width * r.height) / 7));
          const subSize = Math.max(8, labelSize - 2);
          const cx = r.x + r.width / 2;
          const cy = r.y + r.height / 2;
          const hideLabel = Math.min(r.width, r.height) < 18;

          // For wine tiles, use the formatter
          const node = nodeMap.get(r.item.id);
          const labels = isWine ? wineTileLabel(node!) : { primary: r.item.label, secondary: `${r.item.weight} ${r.item.weight === 1 ? 'wine' : 'wines'}` };

          const composition = node?.composition ?? [];
          const hasComposition = !isWine && composition.length > 0;
          // Unique clip-path id for rounded composition bands
          const clipId = `clip-${r.item.id.replace(/[^a-zA-Z0-9]/g, '_')}`;

          return (
            <g
              key={r.item.id}
              onClick={() => handleClick(r.item.id)}
              onMouseEnter={() => handleMouseEnter(r.item.id, cx, cy)}
              onMouseLeave={handleMouseLeave}
              onKeyDown={(e) => handleKeyDown(e, r.item.id)}
              tabIndex={0}
              role="button"
              aria-label={isWine ? labels.primary : `${labels.primary}, ${r.item.weight} wines`}
              style={{ cursor: 'pointer', outline: 'none' }}
            >
              {/* Clip path for rounded corners on composition bands */}
              {hasComposition && (
                <defs>
                  <clipPath id={clipId}>
                    <rect x={r.x} y={r.y} width={r.width} height={r.height} rx={4} ry={4} />
                  </clipPath>
                </defs>
              )}

              {/* Tile fill — composition sub-rects for group tiles, solid for wine tiles */}
              {hasComposition ? (
                <g clipPath={`url(#${clipId})`}>
                  {/* Base fill */}
                  <rect x={r.x} y={r.y} width={r.width} height={r.height} fill="var(--atlas-bg)" />
                  {/* Nested squarified sub-rects showing wine-type composition */}
                  {(() => {
                    const compItems = composition.map((seg: WineTypeSegment) => ({
                      id: seg.type,
                      label: seg.type,
                      weight: seg.count,
                      wineType: seg.type,
                    }));
                    const compRects = squarify(compItems, r.width, r.height, 0.5);
                    const opacity = isHovered ? 0.38 : 0.28;
                    return compRects.map((cr) => (
                      <rect
                        key={cr.item.id}
                        x={r.x + cr.x}
                        y={r.y + cr.y}
                        width={cr.width}
                        height={cr.height}
                        fill={wineTypeTint(cr.item.wineType ?? 'unknown', opacity)}
                        style={{ transition: 'fill 0.12s ease' }}
                      />
                    ));
                  })()}
                </g>
              ) : (
                <rect
                  x={r.x}
                  y={r.y}
                  width={r.width}
                  height={r.height}
                  rx={4}
                  ry={4}
                  fill={isHovered ? nodeHoverTint(wt) : nodeTint(wt)}
                  style={{ transition: 'fill 0.12s ease' }}
                />
              )}

              {/* Tile border */}
              <rect
                x={r.x}
                y={r.y}
                width={r.width}
                height={r.height}
                rx={4}
                ry={4}
                fill="none"
                stroke={isHovered && isWine ? nodeColor(wt) : nodeBorder(wt)}
                strokeWidth={isHovered && isWine ? 1.5 : 1}
                style={{ transition: 'stroke-width 0.12s ease' }}
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
                  <div style={{
                    width: '100%', height: '100%',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    padding: '2px 4px',
                    textAlign: 'center', overflow: 'hidden',
                    pointerEvents: 'none', userSelect: 'none',
                    boxSizing: 'border-box' as const,
                  }}>
                    <div style={{
                      fontSize: `${labelSize}px`, fontWeight: isWine ? 400 : 600,
                      fontFamily: FONT_FAMILY,
                      color: nodeColor(wt ?? (composition.length > 0 ? composition[0].type : undefined)),
                      wordWrap: 'break-word', overflowWrap: 'break-word',
                      lineHeight: '1.2', maxWidth: '100%',
                    }}>
                      {labels.primary}
                    </div>
                    {labels.secondary && r.height > 50 && (
                      <div style={{
                        fontSize: `${subSize}px`, fontWeight: 400,
                        fontFamily: FONT_FAMILY,
                        color: nodeColor(wt),
                        opacity: 0.6, marginTop: 2,
                      }}>
                        {labels.secondary}
                      </div>
                    )}
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
            {tooltip.content.primary}
          </div>
          {tooltip.content.secondary && (
            <div style={{ fontSize: '0.68rem', color: 'var(--atlas-text-placeholder)', marginTop: 2 }}>
              {tooltip.content.secondary}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
