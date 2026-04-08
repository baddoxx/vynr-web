'use client';

import { useRef, useEffect } from 'react';

interface BreadcrumbSegment {
  id: string;
  label: string;
}

interface BreadcrumbProps {
  rootLabel: string;
  segments: BreadcrumbSegment[];
  pathIds: string[];
  onNavigate: (pathIds: string[]) => void;
}

export function Breadcrumb({ rootLabel, segments, pathIds, onNavigate }: BreadcrumbProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevPathLength = useRef(pathIds.length);

  useEffect(() => {
    if (pathIds.length !== prevPathLength.current && scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
    prevPathLength.current = pathIds.length;
  }, [pathIds]);

  const isAtRoot = segments.length === 0;

  return (
    <div
      ref={scrollRef}
      style={{
        display: 'flex', alignItems: 'center', gap: 0, fontSize: '0.72rem',
        color: 'var(--atlas-text-secondary)', overflowX: 'auto', whiteSpace: 'nowrap',
        flex: 1, minWidth: 0, scrollbarWidth: 'none',
      }}
    >
      {isAtRoot ? (
        <span style={{ color: 'var(--atlas-text)', fontWeight: 500 }}>{rootLabel}</span>
      ) : (
        <button
          onClick={() => onNavigate([])}
          style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            color: 'var(--atlas-text-secondary)', fontSize: 'inherit', fontFamily: 'inherit',
          }}
        >
          {rootLabel}
        </button>
      )}
      {segments.map((segment, i) => {
        const isTerminal = i === segments.length - 1;
        return (
          <span key={segment.id} style={{ display: 'inline-flex', alignItems: 'center' }}>
            <span style={{ margin: '0 6px', color: 'var(--atlas-text-placeholder)', opacity: 0.5 }}>›</span>
            {isTerminal ? (
              <span style={{ color: 'var(--atlas-text)', fontWeight: 500 }}>{segment.label}</span>
            ) : (
              <button
                onClick={() => onNavigate(pathIds.slice(0, i + 1))}
                style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  color: 'var(--atlas-text-secondary)', fontSize: 'inherit', fontFamily: 'inherit',
                }}
              >
                {segment.label}
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
}
