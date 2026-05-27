// ============================================================
// Supabase Client — Full SaaS Backend
// ============================================================
// SETUP:
//   1. supabase.com → Create project
//   2. Get URL + anon key from Settings → API
//   3. Paste into Settings app → Cloud tab
//   OR set in localStorage key 'linuxos_supabase_config'
//
// DATABASE SCHEMA (run in Supabase SQL Editor):
//
// -- User app data (generic key-value per user per app)
// CREATE TABLE app_data (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
//   app_id TEXT NOT NULL,
//   data_key TEXT NOT NULL,
//   data JSONB NOT NULL DEFAULT '{}',
//   updated_at TIMESTAMPTZ DEFAULT now(),
//   UNIQUE(user_id, app_id, data_key)
// );
// ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Users own their data" ON app_data
//   FOR ALL USING (auth.uid() = user_id);
//
// -- File system nodes
// CREATE TABLE fs_nodes (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
//   node_id TEXT NOT NULL,
//   parent_id TEXT,
//   name TEXT NOT NULL,
//   type TEXT NOT NULL CHECK (type IN ('file', 'folder')),
//   content TEXT,
//   size INT DEFAULT 0,
//   is_hidden BOOLEAN DEFAULT false,
//   created_at TIMESTAMPTZ DEFAULT now(),
//   modified_at TIMESTAMPTZ DEFAULT now(),
//   UNIQUE(user_id, node_id)
// );
// ALTER TABLE fs_nodes ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Users own their files" ON fs_nodes
//   FOR ALL USING (auth.uid() = user_id);
//
// -- User settings / preferences
// CREATE TABLE user_settings (
//   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
//   theme JSONB DEFAULT '{}',
//   preferences JSONB DEFAULT '{}',
//   updated_at TIMESTAMPTZ DEFAULT now()
// );
// ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Users own their settings" ON user_settings
//   FOR ALL USING (auth.uid() = user_id);
// ============================================================

import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

let client: SupabaseClient | null = null;

export function getSupabaseConfig(): SupabaseConfig {
  try {
    const saved = localStorage.getItem('linuxos_supabase_config');
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return { url: '', anonKey: '' };
}

export function isSupabaseConfigured(): boolean {
  const config = getSupabaseConfig();
  return !!(config.url && config.anonKey);
}

export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  if (!isSupabaseConfigured()) return null;
  try {
    const config = getSupabaseConfig();
    client = createClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
    return client;
  } catch (error) {
    console.error('[Supabase] Init failed:', error);
    return null;
  }
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  localStorage.setItem('linuxos_supabase_config', JSON.stringify(config));
  client = null; // Reset so next call re-initializes
}

// ---- Auth helpers ----

export async function signInWithGoogle() {
  const sb = getSupabase();
  if (!sb) return { error: 'Supabase not configured' };
  const { error } = await sb.auth.signInWithOAuth({ provider: 'google' });
  return { error: error?.message };
}

export async function signInWithGitHub() {
  const sb = getSupabase();
  if (!sb) return { error: 'Supabase not configured' };
  const { error } = await sb.auth.signInWithOAuth({ provider: 'github' });
  return { error: error?.message };
}

export async function signInWithEmail(email: string, password: string) {
  const sb = getSupabase();
  if (!sb) return { error: 'Supabase not configured' };
  const { error } = await sb.auth.signInWithPassword({ email, password });
  return { error: error?.message };
}

export async function signUpWithEmail(email: string, password: string) {
  const sb = getSupabase();
  if (!sb) return { error: 'Supabase not configured' };
  const { error } = await sb.auth.signUp({ email, password });
  return { error: error?.message };
}

export async function signOut() {
  const sb = getSupabase();
  if (!sb) return;
  await sb.auth.signOut();
}

export async function getCurrentUser(): Promise<User | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user;
}

// ---- Data helpers ----

export async function saveAppData(userId: string, appId: string, key: string, data: unknown) {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from('app_data').upsert({
    user_id: userId,
    app_id: appId,
    data_key: key,
    data,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,app_id,data_key' });
}

export async function loadAppData<T>(userId: string, appId: string, key: string): Promise<T | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.from('app_data').select('data')
    .eq('user_id', userId).eq('app_id', appId).eq('data_key', key).single();
  return data?.data as T ?? null;
}

export async function saveUserSettings(userId: string, theme: unknown, preferences: unknown) {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from('user_settings').upsert({
    user_id: userId,
    theme,
    preferences,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
}

export async function loadUserSettings(userId: string): Promise<{ theme: unknown; preferences: unknown } | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.from('user_settings').select('theme, preferences')
    .eq('user_id', userId).single();
  return data ?? null;
}

// ---- Real-time subscriptions ----

export function subscribeToAppData(
  userId: string,
  appId: string,
  callback: (payload: { key: string; data: unknown }) => void
) {
  const sb = getSupabase();
  if (!sb) return () => {};

  const channel = sb.channel(`app_data:${appId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'app_data',
      filter: `user_id=eq.${userId},app_id=eq.${appId}`,
    }, (payload) => {
      const row = payload.new as { data_key: string; data: unknown };
      callback({ key: row.data_key, data: row.data });
    })
    .subscribe();

  return () => { sb.removeChannel(channel); };
}

// ---- File Storage ----

export async function uploadFile(userId: string, path: string, file: File | Blob) {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.storage.from('user-files')
    .upload(`${userId}/${path}`, file, { upsert: true });
  if (error) { console.error('[Storage] Upload error:', error); return null; }
  return data.path;
}

export async function downloadFile(userId: string, path: string): Promise<Blob | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.storage.from('user-files')
    .download(`${userId}/${path}`);
  if (error) { console.error('[Storage] Download error:', error); return null; }
  return data;
}

export async function deleteFile(userId: string, path: string) {
  const sb = getSupabase();
  if (!sb) return;
  await sb.storage.from('user-files').remove([`${userId}/${path}`]);
}

export async function listFiles(userId: string, folder: string) {
  const sb = getSupabase();
  if (!sb) return [];
  const { data } = await sb.storage.from('user-files').list(`${userId}/${folder}`);
  return data ?? [];
}
