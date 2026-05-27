// ============================================================
// usePerformanceMonitor — Real-time performance metrics
// FPS counter, JS Heap usage, DOM node count, INP tracking
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';

export interface PerformanceMetrics {
  fps: number;
  heapUsedMB: number;
  heapTotalMB: number;
  domNodes: number;
  inp: number | null;
  pageLoadTime: number | null;
}

const EMPTY_METRICS: PerformanceMetrics = {
  fps: 0,
  heapUsedMB: 0,
  heapTotalMB: 0,
  domNodes: 0,
  inp: null,
  pageLoadTime: null,
};

/**
 * Monitors real-time performance metrics using browser Performance APIs.
 * Uses requestAnimationFrame for FPS, PerformanceObserver for INP,
 * and performance.memory for heap stats.
 *
 * @param enabled - Whether to actively monitor (default: false)
 * @param interval - How often to sample metrics in ms (default: 1000)
 */
export function usePerformanceMonitor(enabled = false, interval = 1000) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(EMPTY_METRICS);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const rafIdRef = useRef<number>(0);
  const inpRef = useRef<number | null>(null);

  // FPS counter via requestAnimationFrame
  const countFrame = useCallback(() => {
    frameCountRef.current++;
    rafIdRef.current = requestAnimationFrame(countFrame);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Start FPS counting
    rafIdRef.current = requestAnimationFrame(countFrame);

    // INP observer (Interaction to Next Paint)
    let inpObserver: PerformanceObserver | null = null;
    try {
      inpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const duration = (entry as PerformanceEventTiming).duration;
          if (inpRef.current === null || duration > inpRef.current) {
            inpRef.current = duration;
          }
        }
      });
      inpObserver.observe({ type: 'event', buffered: true } as PerformanceObserverInit);
    } catch {
      // PerformanceObserver for 'event' not supported
    }

    // Sample metrics at interval
    const timer = setInterval(() => {
      const now = performance.now();
      const elapsed = now - lastTimeRef.current;
      const fps = Math.round((frameCountRef.current / elapsed) * 1000);
      frameCountRef.current = 0;
      lastTimeRef.current = now;

      // Memory (Chrome only)
      const mem = (performance as any).memory;
      const heapUsedMB = mem ? Math.round(mem.usedJSHeapSize / 1024 / 1024) : 0;
      const heapTotalMB = mem ? Math.round(mem.totalJSHeapSize / 1024 / 1024) : 0;

      // DOM node count
      const domNodes = document.querySelectorAll('*').length;

      // Page load time
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      const pageLoadTime = navEntry
        ? Math.round(navEntry.loadEventEnd - navEntry.fetchStart)
        : null;

      setMetrics({
        fps,
        heapUsedMB,
        heapTotalMB,
        domNodes,
        inp: inpRef.current,
        pageLoadTime,
      });
    }, interval);

    return () => {
      cancelAnimationFrame(rafIdRef.current);
      clearInterval(timer);
      inpObserver?.disconnect();
    };
  }, [enabled, interval, countFrame]);

  return metrics;
}

// Type for PerformanceEventTiming (not yet in all TS libs)
interface PerformanceEventTiming extends PerformanceEntry {
  duration: number;
  processingStart: number;
  processingEnd: number;
  interactionId: number;
}
