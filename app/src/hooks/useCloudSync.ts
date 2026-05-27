// ============================================================
// useCloudSync — Universal cloud sync hook for all apps
// ============================================================
// Usage:
//   const { data, save, isCloud, isSyncing } = useCloudSync<Todo[]>('todos', 'items', []);
//   // Reads from cloud if configured, falls back to localStorage
//   // Writes to both cloud and localStorage for offline support
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { isSupabaseConfigured, saveAppData, loadAppData, subscribeToAppData, getCurrentUser } from '@/lib/supabase';

interface CloudSyncResult<T> {
  data: T;
  setData: (value: T | ((prev: T) => T)) => void;
  save: (value?: T) => Promise<void>;
  isCloud: boolean;
  isSyncing: boolean;
  lastSynced: Date | null;
}

export function useCloudSync<T>(
  appId: string,
  dataKey: string,
  defaultValue: T,
  localStorageKey?: string
): CloudSyncResult<T> {
  const lsKey = localStorageKey || `ubuntuos_${appId}_${dataKey}`;
  const isCloud = isSupabaseConfigured();
  const [data, setDataInternal] = useState<T>(() => {
    // Always load from localStorage first (offline-first)
    try {
      const saved = localStorage.getItem(lsKey);
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return defaultValue;
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const userIdRef = useRef<string | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  // Get user ID on mount
  useEffect(() => {
    if (!isCloud) return;
    getCurrentUser().then(user => {
      if (user) userIdRef.current = user.id;
    });
  }, [isCloud]);

  // Initial cloud load
  useEffect(() => {
    if (!isCloud) return;
    let cancelled = false;

    const loadFromCloud = async () => {
      const user = await getCurrentUser();
      if (!user || cancelled) return;
      userIdRef.current = user.id;
      setIsSyncing(true);
      try {
        const cloudData = await loadAppData<T>(user.id, appId, dataKey);
        if (cloudData !== null && !cancelled) {
          setDataInternal(cloudData);
          // Also update localStorage for offline
          localStorage.setItem(lsKey, JSON.stringify(cloudData));
          setLastSynced(new Date());
        }
      } catch (err) {
        console.warn(`[CloudSync] Load failed for ${appId}/${dataKey}:`, err);
      }
      if (!cancelled) setIsSyncing(false);
    };

    loadFromCloud();
    return () => { cancelled = true; };
  }, [isCloud, appId, dataKey, lsKey]);

  // Real-time subscription
  useEffect(() => {
    if (!isCloud || !userIdRef.current) return;

    const unsubscribe = subscribeToAppData(userIdRef.current, appId, (payload) => {
      if (payload.key === dataKey) {
        setDataInternal(payload.data as T);
        localStorage.setItem(lsKey, JSON.stringify(payload.data));
        setLastSynced(new Date());
      }
    });

    return unsubscribe;
  }, [isCloud, appId, dataKey, lsKey]);

  // Set data (updates local state + localStorage immediately)
  const setData = useCallback((value: T | ((prev: T) => T)) => {
    setDataInternal(prev => {
      const next = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
      // Always save to localStorage for offline
      try {
        localStorage.setItem(lsKey, JSON.stringify(next));
      } catch { /* quota exceeded */ }
      return next;
    });
  }, [lsKey]);

  // Save to cloud (debounced)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const save = useCallback(async (value?: T) => {
    const dataToSave = value ?? dataRef.current;

    // Always save localStorage
    try {
      localStorage.setItem(lsKey, JSON.stringify(dataToSave));
    } catch { /* ignore */ }

    // Cloud save with debounce
    if (!isCloud) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      const user = await getCurrentUser();
      if (!user) return;
      setIsSyncing(true);
      try {
        await saveAppData(user.id, appId, dataKey, dataToSave);
        setLastSynced(new Date());
      } catch (err) {
        console.warn(`[CloudSync] Save failed for ${appId}/${dataKey}:`, err);
      }
      setIsSyncing(false);
    }, 500); // 500ms debounce
  }, [isCloud, appId, dataKey, lsKey]);

  // Auto-save when data changes (cloud mode only)
  useEffect(() => {
    if (!isCloud) return;
    save();
  }, [data, isCloud, save]);

  return { data, setData, save, isCloud, isSyncing, lastSynced };
}

// Simplified version for simple key-value settings
export function useCloudSetting<T>(key: string, defaultValue: T) {
  return useCloudSync<T>('settings', key, defaultValue, `ubuntuos_${key}`);
}
