'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { squarify, type TreemapItem } from '@/lib/treemap-layout';
import {
  wineTypeTint,
  wineTypeHoverTint,
  wineTypeColor,
  wineTypeBorder,
} from '@/lib/treemap-colors';
import { type CellarNode, isWineNode, canDrill } from '@/lib/cellar-tree';

// ─── Tint helpers (tolerate undefined wineType) ─────────────────────────────

const NEUTRAL = { r: 0x8a, g: 0x7d, b: 0x68 };

function nodeTint(wineType: string | undefined, opacity: number = 0.10): string {
  if (!wineType) return `rgba(${NEUTRAL.r}, ${NEUTRAL.g}, ${NEUTRAL.b}, ${opacity})`;
  return wineTypeTint(wineType, opacity);
}

function nodeHoverTint(wineType: string | undefined): string {
  if (!wineType) return `rgba(${NEUTRAL.r}, ${NEUTRAL.g}, ${NEUTRAL.b}, 0.20)`;
  return wineTypeHoverTint(wineType);
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

// ─── Label thresholds ───────────────────────────────────────────────────────

const MIN_LABEL_DIM = 60;
const MIN_SUB_DIM = 40;

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

  // Height policy: 3:2 desktop, 4:3 mobile, clamped
  const isMobile = measuredWidth > 0 && measuredWidth < 480;
  const ratio = isMobile ? 4 / 3 : 3 / 2;
  const rawHeight = measuredWidth / ratio;
  const minH = isMobile ? 200 : 250;
  const maxH = isMobile ? 400 : 500;
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
          borderRadius: 10,
          border: '1px solid var(--atlas-card-stroke)',
          background: 'var(--atlas-bg)',
          overflow: 'hidden',
        }}
        role="group"
        aria-label={ariaLabel}
      >
        {rects.map((r) => {
          const isHovered = hoveredNodeId === r.item.id;
          const wt = r.item.wineType;
          const minDim = Math.min(r.width, r.height);
          const showLabel = minDim >= MIN_LABEL_DIM;
          const showSub = minDim >= MIN_SUB_DIM;
          const isWine = isTerminalPath;

          const labelSize = Math.max(10, Math.min(14, Math.sqrt(r.width * r.height) / 8));
          const subSize = Math.max(8, labelSize - 2);

          // For wine tiles, use the formatter
          const labels = isWine ? wineTileLabel(nodeMap.get(r.item.id)!) : { primary: r.item.label, secondary: `${r.item.weight} ${r.item.weight === 1 ? 'wine' : 'wines'}` };

          return (
            <g
              key={r.item.id}
              onClick={() => handleClick(r.item.id)}
              onMouseEnter={() => handleMouseEnter(r.item.id, r.x + r.width / 2, r.y + r.height / 2)}
              onMouseLeave={handleMouseLeave}
              onKeyDown={(e) => handleKeyDown(e, r.item.id)}
              tabIndex={0}
              role="button"
              aria-label={isWine ? labels.primary : `${labels.primary}, ${r.item.weight} wines`}
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
                fill={isHovered ? nodeHoverTint(wt) : nodeTint(wt)}
                stroke={isHovered && isWine ? nodeColor(wt) : nodeBorder(wt)}
                strokeWidth={isHovered && isWine ? 1.5 : 1}
                style={{ transition: 'fill 0.12s ease, stroke-width 0.12s ease' }}
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

              {/* Primary label */}
              {showLabel && (
                <text
                  x={r.x + r.width / 2}
                  y={r.y + r.height / 2 - (showSub && labels.secondary ? subSize * 0.4 : 0)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={nodeColor(wt)}
                  fontSize={labelSize}
                  fontWeight={500}
                  fontFamily="'Avenir Next', 'Avenir', 'Nunito Sans', 'Trebuchet MS', sans-serif"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {labels.primary}
                </text>
              )}

              {/* Sub-label */}
              {showSub && showLabel && labels.secondary && (
                <text
                  x={r.x + r.width / 2}
                  y={r.y + r.height / 2 + labelSize * 0.7}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={nodeColor(wt)}
                  fontSize={subSize}
                  fontWeight={400}
                  fontFamily="'Avenir Next', 'Avenir', 'Nunito Sans', 'Trebuchet MS', sans-serif"
                  opacity={0.6}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {labels.secondary}
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
