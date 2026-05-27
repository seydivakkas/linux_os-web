// ============================================================
// System Settings — Full system preferences panel
// ============================================================

import { useState, useCallback } from 'react';
import {
  Wifi, Bluetooth, Image, Palette, Bell, Volume2, Battery,
  Monitor, Mouse, Keyboard, Printer, Disc, Clock, User,
  Star, Eye, Info, Search, Check, Globe, Languages, Cloud, Database, Shield,
} from 'lucide-react';
import { useOS } from '@/hooks/useOSStore';
import { useTranslation } from '@/i18n';
import type { Locale } from '@/i18n';
import type { ColorTheme } from '@/types';
import {
  isSupabaseConfigured, getSupabaseConfig, saveSupabaseConfig,
  getSupabase, signOut as cloudSignOut, getCurrentUser,
} from '@/lib/supabase';

interface SettingCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const CATEGORIES: SettingCategory[] = [
  { id: 'wifi', label: 'Wi-Fi', icon: <Wifi size={18} /> },
  { id: 'bluetooth', label: 'Bluetooth', icon: <Bluetooth size={18} /> },
  { id: 'background', label: 'Background', icon: <Image size={18} /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
  { id: 'sound', label: 'Sound', icon: <Volume2 size={18} /> },
  { id: 'power', label: 'Power', icon: <Battery size={18} /> },
  { id: 'display', label: 'Display', icon: <Monitor size={18} /> },
  { id: 'mouse', label: 'Mouse & Touchpad', icon: <Mouse size={18} /> },
  { id: 'keyboard', label: 'Keyboard', icon: <Keyboard size={18} /> },
  { id: 'printers', label: 'Printers', icon: <Printer size={18} /> },
  { id: 'removable', label: 'Removable Media', icon: <Disc size={18} /> },
  { id: 'datetime', label: 'Date & Time', icon: <Clock size={18} /> },
  { id: 'users', label: 'Users', icon: <User size={18} /> },
  { id: 'defaultapps', label: 'Default Apps', icon: <Star size={18} /> },
  { id: 'privacy', label: 'Privacy', icon: <Eye size={18} /> },
  { id: 'language', label: 'Language', icon: <Globe size={18} /> },
  { id: 'accessibility', label: 'Accessibility', icon: <Languages size={18} /> },
  { id: 'cloud', label: 'Cloud & Sync', icon: <Cloud size={18} /> },
  { id: 'about', label: 'About', icon: <Info size={18} /> },
];

const ACCENT_COLORS = [
  { name: 'Purple', value: '#7C4DFF' },
  { name: 'Blue', value: '#2196F3' },
  { name: 'Teal', value: '#009688' },
  { name: 'Green', value: '#4CAF50' },
  { name: 'Yellow', value: '#FFEB3B' },
  { name: 'Orange', value: '#FF9800' },
  { name: 'Red', value: '#F44336' },
  { name: 'Pink', value: '#E91E63' },
];

const WALLPAPERS = [
  { id: '/wallpaper-default.jpg', name: 'Default' },
  { id: '/wallpaper-light.jpg', name: 'Light' },
  { id: '/wallpaper-nature.jpg', name: 'Nature' },
  { id: '/wallpaper-tech.jpg', name: 'Tech' },
];

const Toggle: React.FC<{ value: boolean; onChange: (v: boolean) => void }> = ({ value, onChange }) => (
  <button
    onClick={() => onChange(!value)}
    className="relative h-6 rounded-full transition-colors duration-150"
    style={{
      width: 40,
      background: value ? 'var(--accent-primary)' : 'var(--border-default)',
    }}
  >
    <div
      className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-150"
      style={{ left: value ? 18 : 2 }}
    />
  </button>
);

const Slider: React.FC<{ value: number; min?: number; max?: number; onChange: (v: number) => void }> = ({ value, min = 0, max = 100, onChange }) => (
  <input
    type="range"
    min={min}
    max={max}
    value={value}
    onChange={e => onChange(Number(e.target.value))}
    className="w-32 h-1 rounded-full appearance-none cursor-pointer"
    style={{
      background: `linear-gradient(to right, var(--accent-primary) ${(value - min) / (max - min) * 100}%, var(--border-default) ${(value - min) / (max - min) * 100}%)`,
    }}
  />
);

const COLOR_THEMES: { id: ColorTheme; name: string; preview: string }[] = [
  { id: 'default', name: 'Default', preview: '#7C4DFF' },
  { id: 'nord', name: 'Nord', preview: '#88C0D0' },
  { id: 'dracula', name: 'Dracula', preview: '#BD93F9' },
  { id: 'solarized', name: 'Solarized', preview: '#268BD2' },
  { id: 'gruvbox', name: 'Gruvbox', preview: '#FE8019' },
  { id: 'tokyo-night', name: 'Tokyo Night', preview: '#7AA2F7' },
];

const Settings: React.FC = () => {
  const { state, dispatch } = useOS();
  const { locale, setLocale, availableLocales } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('appearance');
  const [search, setSearch] = useState('');

  // Settings state (loaded from localStorage)
  const [settings, setSettings] = useState<Record<string, unknown>>(() => {
    try { return JSON.parse(localStorage.getItem('ubuntuos_settings') || '{}'); } catch { return {}; }
  });

  const updateSetting = useCallback((key: string, value: unknown) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem('ubuntuos_settings', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('ubuntuos:settings-updated', { detail: { key, value } }));
      return next;
    });
  }, []);

  const s = (key: string, def: unknown) => settings[key] ?? def;

  const filteredCategories = search
    ? CATEGORIES.filter(c => c.label.toLowerCase().includes(search.toLowerCase()))
    : CATEGORIES;

  const renderPanel = () => {
    switch (activeCategory) {
      case 'wifi':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Wi-Fi</h2>
            <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <div className="text-sm text-[var(--text-primary)]">Wi-Fi</div>
                <div className="text-xs text-[var(--text-secondary)]">{s('wifi_enabled', true) ? 'Connected to HomeNetwork' : 'Off'}</div>
              </div>
              <Toggle value={!!s('wifi_enabled', true)} onChange={v => updateSetting('wifi_enabled', v)} />
            </div>
            {!!s('wifi_enabled', true) && (
              <div className="space-y-2">
                <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Known Networks</div>
                {['HomeNetwork', 'Office_WiFi', 'CoffeeShop_Guest'].map(n => (
                  <div key={n} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[var(--bg-hover)]">
                    <div className="flex items-center gap-2">
                      <Wifi size={14} className="text-[var(--accent-primary)]" />
                      <span className="text-sm text-[var(--text-primary)]">{n}</span>
                    </div>
                    <Check size={14} className="text-[var(--accent-primary)]" />
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Appearance</h2>
            <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <div className="text-sm text-[var(--text-primary)]">Dark Mode</div>
                <div className="text-xs text-[var(--text-secondary)]">Use dark theme across the system</div>
              </div>
              <Toggle value={state.theme.mode === 'dark'} onChange={() => dispatch({ type: 'TOGGLE_THEME' })} />
            </div>
            <div className="space-y-3">
              <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Accent Color</div>
              <div className="flex gap-3 flex-wrap">
                {ACCENT_COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => dispatch({ type: 'SET_THEME', theme: { accent: c.value } })}
                    className="w-10 h-10 rounded-full transition-transform hover:scale-110"
                    style={{
                      background: c.value,
                      boxShadow: state.theme.accent === c.value ? `0 0 0 3px white, 0 0 0 5px ${c.value}` : 'none',
                    }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Color Theme */}
            <div className="space-y-3">
              <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Color Theme</div>
              <div className="grid grid-cols-3 gap-2">
                {COLOR_THEMES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => dispatch({ type: 'SET_THEME', theme: { colorTheme: t.id } })}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs transition-all hover:scale-[1.02]"
                    style={{
                      background: state.theme.colorTheme === t.id ? 'var(--bg-selected)' : 'var(--bg-input)',
                      border: state.theme.colorTheme === t.id ? `2px solid ${t.preview}` : '2px solid transparent',
                    }}
                  >
                    <div className="w-4 h-4 rounded-full shrink-0" style={{ background: t.preview }} />
                    <span style={{ color: state.theme.colorTheme === t.id ? t.preview : 'var(--text-primary)' }}>
                      {t.name}
                    </span>
                    {state.theme.colorTheme === t.id && <Check size={12} style={{ color: t.preview, marginLeft: 'auto' }} />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'background':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Background</h2>
            <div className="grid grid-cols-2 gap-4">
              {WALLPAPERS.map(w => (
                <button
                  key={w.id}
                  onClick={() => dispatch({ type: 'SET_THEME', theme: { wallpaper: w.id } })}
                  className="relative rounded-lg overflow-hidden border-2 transition-all hover:scale-[1.02]"
                  style={{
                    borderColor: state.theme.wallpaper === w.id ? 'var(--accent-primary)' : 'transparent',
                    aspectRatio: '16/9',
                  }}
                >
                  <img src={w.id} alt={w.name} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 px-2 py-1 text-xs text-white" style={{ background: 'rgba(0,0,0,0.6)' }}>
                    {w.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Notifications</h2>
            <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <div className="text-sm text-[var(--text-primary)]">Do Not Disturb</div>
                <div className="text-xs text-[var(--text-secondary)]">Silence all notifications</div>
              </div>
              <Toggle value={!!s('dnd', false)} onChange={v => updateSetting('dnd', v)} />
            </div>
            <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mt-4">Per-App Settings</div>
            {['Calendar', 'Todo List', 'Reminders', 'Email'].map(app => (
              <div key={app} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[var(--bg-hover)]">
                <span className="text-sm text-[var(--text-primary)]">{app}</span>
                <Toggle value={!!s(`notif_${app}`, true)} onChange={v => updateSetting(`notif_${app}`, v)} />
              </div>
            ))}
          </div>
        );

      case 'sound':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Sound</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-[var(--text-primary)]">Output Volume</div>
                <Slider value={s('output_vol', 75) as number} onChange={v => updateSetting('output_vol', v)} />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-[var(--text-primary)]">Input Volume</div>
                <Slider value={s('input_vol', 60) as number} onChange={v => updateSetting('input_vol', v)} />
              </div>
              <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div>
                  <div className="text-sm text-[var(--text-primary)]">Output Device</div>
                </div>
                <select
                  className="text-xs bg-[var(--bg-input)] text-[var(--text-primary)] border rounded-md px-2 py-1 outline-none"
                  style={{ borderColor: 'var(--border-default)' }}
                  value={s('output_device', 'speakers') as string}
                  onChange={e => updateSetting('output_device', e.target.value)}
                >
                  <option value="speakers">Built-in Speakers</option>
                  <option value="headphones">Headphones</option>
                  <option value="hdmi">HDMI</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-[var(--text-primary)]">Alert Sound</div>
                <Toggle value={!!s('alert_sound', true)} onChange={v => updateSetting('alert_sound', v)} />
              </div>
            </div>
          </div>
        );

      case 'display':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Display</h2>
            <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <div className="text-sm text-[var(--text-primary)]">Resolution</div>
              </div>
              <select
                className="text-xs bg-[var(--bg-input)] text-[var(--text-primary)] border rounded-md px-2 py-1 outline-none"
                style={{ borderColor: 'var(--border-default)' }}
                value={s('resolution', '1920x1080') as string}
                onChange={e => updateSetting('resolution', e.target.value)}
              >
                <option value="1920x1080">1920 x 1080</option>
                <option value="2560x1440">2560 x 1440</option>
                <option value="3840x2160">3840 x 2160</option>
                <option value="1280x720">1280 x 720</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-[var(--text-primary)]">Scale</div>
              <select
                className="text-xs bg-[var(--bg-input)] text-[var(--text-primary)] border rounded-md px-2 py-1 outline-none"
                style={{ borderColor: 'var(--border-default)' }}
                value={s('scale', '100') as string}
                onChange={e => updateSetting('scale', e.target.value)}
              >
                <option value="100">100%</option>
                <option value="125">125%</option>
                <option value="150">150%</option>
                <option value="200">200%</option>
              </select>
            </div>
          </div>
        );

      case 'power':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Power</h2>
            <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <div className="text-sm text-[var(--text-primary)]">Screen Blank</div>
                <div className="text-xs text-[var(--text-secondary)]">Turn off screen after inactivity</div>
              </div>
              <select
                className="text-xs bg-[var(--bg-input)] text-[var(--text-primary)] border rounded-md px-2 py-1 outline-none"
                style={{ borderColor: 'var(--border-default)' }}
                value={s('screen_blank', '5min') as string}
                onChange={e => updateSetting('screen_blank', e.target.value)}
              >
                <option value="1min">1 minute</option>
                <option value="5min">5 minutes</option>
                <option value="10min">10 minutes</option>
                <option value="never">Never</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-[var(--text-primary)]">Automatic Suspend</div>
              <Toggle value={!!s('auto_suspend', true)} onChange={v => updateSetting('auto_suspend', v)} />
            </div>
          </div>
        );

      case 'datetime':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Date & Time</h2>
            <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <div className="text-sm text-[var(--text-primary)]">24-Hour Time</div>
              </div>
              <Toggle value={!!s('24h', false)} onChange={v => updateSetting('24h', v)} />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-[var(--text-primary)]">Time Zone</div>
              <select
                className="text-xs bg-[var(--bg-input)] text-[var(--text-primary)] border rounded-md px-2 py-1 outline-none"
                style={{ borderColor: 'var(--border-default)' }}
                value={s('timezone', 'UTC') as string}
                onChange={e => updateSetting('timezone', e.target.value)}
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Privacy</h2>
            <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <div className="text-sm text-[var(--text-primary)]">Screen Lock</div>
                <div className="text-xs text-[var(--text-secondary)]">Lock screen after screen blank</div>
              </div>
              <Toggle value={!!s('screen_lock', true)} onChange={v => updateSetting('screen_lock', v)} />
            </div>
            <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <div className="text-sm text-[var(--text-primary)]">Usage Data</div>
                <div className="text-xs text-[var(--text-secondary)]">Send anonymous usage statistics</div>
              </div>
              <Toggle value={!!s('usage_data', false)} onChange={v => updateSetting('usage_data', v)} />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-[var(--text-primary)]">Location Services</div>
              <Toggle value={!!s('location', false)} onChange={v => updateSetting('location', v)} />
            </div>
          </div>
        );

      case 'language':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Language</h2>
            <p className="text-xs text-[var(--text-secondary)]">Choose the display language for the desktop environment.</p>
            <div className="space-y-2">
              {(Object.entries(availableLocales) as [Locale, string][]).map(([code, name]) => (
                <button
                  key={code}
                  onClick={() => setLocale(code)}
                  className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm transition-all"
                  style={{
                    background: locale === code ? 'var(--bg-selected)' : 'var(--bg-input)',
                    border: locale === code ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{code === 'en' ? '🇬🇧' : code === 'tr' ? '🇹🇷' : '🌐'}</span>
                    <div className="text-left">
                      <div style={{ color: 'var(--text-primary)' }}>{name}</div>
                      <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{code.toUpperCase()}</div>
                    </div>
                  </div>
                  {locale === code && <Check size={18} style={{ color: 'var(--accent-primary)' }} />}
                </button>
              ))}
            </div>
            <div className="mt-4 px-4 py-3 rounded-lg text-xs" style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
              <strong>Note:</strong> Language changes are applied immediately. Some application content may remain in English.
            </div>
          </div>
        );

      case 'accessibility':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Accessibility</h2>
            <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <div className="text-sm text-[var(--text-primary)]">Reduce Motion</div>
                <div className="text-xs text-[var(--text-secondary)]">Minimizes animations throughout the interface</div>
              </div>
              <Toggle value={!!s('reduce_motion', false)} onChange={v => {
                updateSetting('reduce_motion', v);
                document.documentElement.style.setProperty('--reduce-motion', v ? 'reduce' : 'no-preference');
              }} />
            </div>
            <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <div className="text-sm text-[var(--text-primary)]">High Contrast</div>
                <div className="text-xs text-[var(--text-secondary)]">Increase contrast for better visibility</div>
              </div>
              <Toggle value={!!s('high_contrast', false)} onChange={v => updateSetting('high_contrast', v)} />
            </div>
            <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <div className="text-sm text-[var(--text-primary)]">Large Text</div>
                <div className="text-xs text-[var(--text-secondary)]">Increase font size across the system</div>
              </div>
              <Toggle value={!!s('large_text', false)} onChange={v => updateSetting('large_text', v)} />
            </div>
            <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <div className="text-sm text-[var(--text-primary)]">Screen Reader Support</div>
                <div className="text-xs text-[var(--text-secondary)]">Enhanced ARIA attributes for assistive technologies</div>
              </div>
              <Toggle value={!!s('screen_reader', false)} onChange={v => updateSetting('screen_reader', v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-[var(--text-primary)]">Keyboard Shortcuts</div>
                <div className="text-xs text-[var(--text-secondary)]">Show keyboard shortcut hints</div>
              </div>
              <Toggle value={!!s('kbd_hints', true)} onChange={v => updateSetting('kbd_hints', v)} />
            </div>
          </div>
        );

      case 'cloud': {
        const config = getSupabaseConfig();
        const isConfigured = isSupabaseConfigured();
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] flex items-center gap-3">
              <Cloud size={24} /> Cloud & Sync
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Connect to Supabase for cloud sync, real authentication, file storage, and multi-device access.
            </p>

            {/* Status */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{
              background: isConfigured ? 'rgba(76,175,80,0.08)' : 'rgba(255,152,0,0.08)',
              border: `1px solid ${isConfigured ? 'rgba(76,175,80,0.2)' : 'rgba(255,152,0,0.2)'}`,
            }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{
                background: isConfigured ? 'rgba(76,175,80,0.15)' : 'rgba(255,152,0,0.15)',
              }}>
                {isConfigured ? <Cloud size={18} style={{ color: '#4CAF50' }} /> : <Database size={18} style={{ color: '#FF9800' }} />}
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: isConfigured ? '#4CAF50' : '#FF9800' }}>
                  {isConfigured ? 'Cloud Connected' : 'Offline Mode'}
                </div>
                <div className="text-[10px] text-[var(--text-secondary)]">
                  {isConfigured ? 'Data syncs across all your devices' : 'Data stored locally in this browser only'}
                </div>
              </div>
            </div>

            {/* Config inputs */}
            <div className="space-y-3">
              <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                <Shield size={12} /> Supabase Configuration
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)] block mb-1">Project URL</label>
                <input
                  defaultValue={config.url}
                  placeholder="https://your-project.supabase.co"
                  className="w-full h-9 px-3 rounded-lg text-sm text-[var(--text-primary)] outline-none"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}
                  onChange={e => {
                    const c = getSupabaseConfig();
                    saveSupabaseConfig({ ...c, url: e.target.value.trim() });
                  }}
                />
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)] block mb-1">Anon Key</label>
                <input
                  defaultValue={config.anonKey}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..."
                  className="w-full h-9 px-3 rounded-lg text-sm text-[var(--text-primary)] outline-none font-mono text-[11px]"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}
                  onChange={e => {
                    const c = getSupabaseConfig();
                    saveSupabaseConfig({ ...c, anonKey: e.target.value.trim() });
                  }}
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="px-4 py-2 rounded-lg text-xs font-medium text-white"
                  style={{ background: 'var(--accent-primary)' }}
                  onClick={async () => {
                    const sb = getSupabase();
                    if (!sb) { alert('Enter URL and key first'); return; }
                    try {
                      const { error } = await sb.auth.getSession();
                      if (error) throw error;
                      alert('\u2705 Connection successful!');
                    } catch (err) {
                      alert('\u274c Connection failed: ' + (err as Error).message);
                    }
                  }}
                >
                  Test Connection
                </button>
                {isConfigured && (
                  <button
                    className="px-4 py-2 rounded-lg text-xs font-medium text-[var(--accent-error)]"
                    style={{ background: 'rgba(244,67,54,0.1)' }}
                    onClick={() => {
                      saveSupabaseConfig({ url: '', anonKey: '' });
                      alert('Cloud disconnected. Reload to apply.');
                    }}
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </div>

            {/* Cloud Sign Out */}
            {isConfigured && (
              <div className="pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs text-[var(--accent-error)] hover:bg-[var(--bg-hover)]"
                  onClick={async () => {
                    await cloudSignOut();
                    window.location.reload();
                  }}
                >
                  Sign out from cloud
                </button>
              </div>
            )}

            {/* Setup Guide */}
            <div className="space-y-2 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Setup Guide</div>
              <ol className="text-xs text-[var(--text-secondary)] space-y-1.5 list-decimal list-inside">
                <li>Go to <span className="text-[var(--accent-primary)]">supabase.com</span> → Create a free project</li>
                <li>Enable Authentication → Providers → Google & GitHub</li>
                <li>Go to SQL Editor → Run the schema from <span className="font-mono text-[10px] text-[var(--accent-primary)]">src/lib/supabase.ts</span></li>
                <li>Copy URL + anon key from Settings → API</li>
                <li>Paste above → Test Connection</li>
                <li>Create a Storage bucket named <span className="font-mono text-[10px] text-[var(--accent-primary)]">user-files</span></li>
              </ol>
            </div>

            {/* What syncs */}
            <div className="space-y-2">
              <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">What Syncs</div>
              <div className="grid grid-cols-2 gap-2">
                {['Notes', 'Todos', 'Calendar', 'Kanban Board', 'Time Tracker', 'Wiki', 'Invoices', 'Dashboard', 'Contacts', 'Spreadsheet', 'Settings', 'File System'].map(item => (
                  <div key={item} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded" style={{ background: 'var(--bg-input)' }}>
                    <Check size={10} style={{ color: isConfigured ? 'var(--accent-success)' : 'var(--text-disabled)' }} />
                    <span style={{ color: 'var(--text-primary)' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case 'about':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-[var(--text-primary)]">About</h2>
            <div className="flex flex-col items-center py-6">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }}>
                <span className="text-3xl font-bold text-white">U</span>
              </div>
              <div className="text-xl font-semibold text-[var(--text-primary)]">UbuntuOS Web</div>
              <div className="text-sm text-[var(--text-secondary)]">Version 24.04 LTS</div>
            </div>
            <div className="space-y-3">
              {[
                ['Device Name', 'ubuntuos-desktop'],
                ['Memory', '8 GB'],
                ['Processor', 'WebAssembly Virtual CPU'],
                ['Graphics', 'WebGL 2.0'],
                ['Storage', '50 GB (Browser localStorage)'],
                ['Browser', navigator.userAgent.slice(0, 50) + '...'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span className="text-sm text-[var(--text-secondary)]">{label}</span>
                  <span className="text-sm text-[var(--text-primary)]">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-4">
              <div className="h-2 flex-1 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
                <div className="h-full rounded-full" style={{ width: '42%', background: 'var(--accent-primary)' }} />
              </div>
              <span className="text-xs text-[var(--text-secondary)]">Storage: 21 GB / 50 GB</span>
            </div>
            <button
              className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
              style={{ background: 'var(--accent-primary)' }}
              onClick={() => alert('You are up to date!')}
            >
              Check for Updates
            </button>

            {/* Workspace Backup & Restore */}
            <div className="space-y-2 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Workspace Data</div>
              <div className="flex gap-2">
                <button
                  className="flex-1 py-2 rounded-lg text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}
                  onClick={() => {
                    const backup: Record<string, string> = {};
                    for (let i = 0; i < localStorage.length; i++) {
                      const key = localStorage.key(i);
                      if (key && (key.startsWith('ubuntuos_') || key.startsWith('linuxos_') || key.startsWith('owm_'))) {
                        backup[key] = localStorage.getItem(key) || '';
                      }
                    }
                    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = `linuxos-backup-${new Date().toISOString().slice(0, 10)}.json`;
                    a.click(); URL.revokeObjectURL(url);
                  }}
                >
                  📦 Export Backup
                </button>
                <button
                  className="flex-1 py-2 rounded-lg text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file'; input.accept = '.json';
                    input.onchange = async () => {
                      const file = input.files?.[0];
                      if (!file) return;
                      try {
                        const text = await file.text();
                        const data = JSON.parse(text) as Record<string, string>;
                        let count = 0;
                        Object.entries(data).forEach(([key, value]) => {
                          if (key.startsWith('ubuntuos_') || key.startsWith('linuxos_') || key.startsWith('owm_')) {
                            localStorage.setItem(key, value);
                            count++;
                          }
                        });
                        alert(`✅ Restored ${count} items. Reload to apply.`);
                      } catch { alert('❌ Invalid backup file.'); }
                    };
                    input.click();
                  }}
                >
                  📥 Import Backup
                </button>
              </div>
              <button
                className="w-full py-2 rounded-lg text-xs font-medium transition-colors"
                style={{ color: 'var(--accent-error)', background: 'rgba(244,67,54,0.06)' }}
                onClick={() => {
                  if (confirm('⚠️ This will delete ALL workspace data. Are you sure?')) {
                    const keys: string[] = [];
                    for (let i = 0; i < localStorage.length; i++) {
                      const key = localStorage.key(i);
                      if (key && (key.startsWith('ubuntuos_') || key.startsWith('linuxos_'))) keys.push(key);
                    }
                    keys.forEach(k => localStorage.removeItem(k));
                    alert('🗑️ All data cleared. Reloading...');
                    window.location.reload();
                  }
                }}
              >
                🗑️ Reset All Data
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
              {CATEGORIES.find(c => c.id === activeCategory)?.label}
            </h2>
            <div className="flex items-center justify-center h-32">
              <span className="text-sm text-[var(--text-secondary)]">Settings for this category are not yet implemented.</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-full" style={{ background: 'var(--bg-window)' }}>
      {/* Sidebar */}
      <div className="w-56 shrink-0 border-r flex flex-col" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-titlebar)' }}>
        <div className="p-2">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: 'var(--bg-input)' }}>
            <Search size={14} className="text-[var(--text-secondary)]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search settings..."
              className="flex-1 bg-transparent text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-disabled)]"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setSearch(''); }}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-sm transition-colors"
              style={{
                background: activeCategory === cat.id ? 'var(--bg-selected)' : 'transparent',
                color: activeCategory === cat.id ? 'var(--accent-primary)' : 'var(--text-primary)',
                borderLeft: activeCategory === cat.id ? '3px solid var(--accent-primary)' : '3px solid transparent',
              }}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        {renderPanel()}
      </div>
    </div>
  );
};

export default Settings;
