import React, { useState, useRef, TouchEvent } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  className = ''
}) => {
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const threshold = 70; // px to trigger refresh

  const handleTouchStart = (e: TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      setStartY(e.touches[0].clientY);
    } else {
      setStartY(0);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!startY || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;

    if (diff > 0 && containerRef.current && containerRef.current.scrollTop === 0) {
      // Apply elastic resistance
      const distance = Math.min(diff * 0.45, 100);
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(50);
      try {
        await onRefresh();
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 400);
      }
    } else {
      setPullDistance(0);
    }
    setStartY(0);
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative overflow-y-auto overscroll-y-contain ${className}`}
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center transition-all overflow-hidden select-none pointer-events-none"
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 10 ? 1 : 0
        }}
        aria-hidden="true"
      >
        <div className="flex items-center gap-2 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
          <RefreshCw
            size={16}
            className={`transition-transform ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            style={{
              transform: isRefreshing ? undefined : `rotate(${pullDistance * 4}deg)`
            }}
          />
          <span>{isRefreshing ? 'Refreshing...' : pullDistance >= threshold ? 'Release to update' : 'Pull down to refresh'}</span>
        </div>
      </div>

      {children}
    </div>
  );
};
