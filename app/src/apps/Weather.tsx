// ============================================================
// Weather — Real API + Geolocation + Fallback mock data
// Uses OpenWeatherMap free tier (no API key = mock mode)
// ============================================================

import { useState, useEffect, useCallback, memo } from 'react';
import {
  Search, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, Droplets,
  Thermometer, Eye, Gauge, Sunrise, Sunset, MapPin, RefreshCw, Loader2, AlertCircle, Key, CloudSun
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ---- Types ----
type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy' | 'partly-cloudy' | 'mist';

interface CurrentWeather {
  city: string;
  country: string;
  condition: WeatherCondition;
  description: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  wind: number;
  pressure: number;
  visibility: number;
  sunrise: string;
  sunset: string;
  icon: string;
}

interface ForecastItem {
  time: string;
  temp: number;
  condition: WeatherCondition;
  icon: string;
}

interface DailyForecast {
  day: string;
  low: number;
  high: number;
  condition: WeatherCondition;
}

// ---- OWM Condition Mapper ----
const mapOWMCondition = (id: number): WeatherCondition => {
  if (id >= 200 && id < 300) return 'stormy';
  if (id >= 300 && id < 400) return 'rainy';
  if (id >= 500 && id < 600) return 'rainy';
  if (id >= 600 && id < 700) return 'snowy';
  if (id >= 700 && id < 800) return 'mist';
  if (id === 800) return 'sunny';
  if (id === 801) return 'partly-cloudy';
  return 'cloudy';
};

const formatUnixTime = (ts: number, tz: number): string => {
  const d = new Date((ts + tz) * 1000);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' });
};

// ---- Icon Component ----
const WeatherIcon = memo(function WeatherIcon({ condition, size = 24 }: { condition: WeatherCondition; size?: number }) {
  const icons: Record<WeatherCondition, LucideIcon> = {
    sunny: Sun, cloudy: Cloud, 'partly-cloudy': CloudSun, rainy: CloudRain, snowy: CloudSnow, stormy: CloudLightning, mist: Cloud,
  };
  const colors: Record<WeatherCondition, string> = {
    sunny: '#FFB300', cloudy: '#90A4AE', 'partly-cloudy': '#64B5F6', rainy: '#42A5F5', snowy: '#B0BEC5', stormy: '#7E57C2', mist: '#78909C',
  };
  const Icon = icons[condition];
  return <Icon size={size} style={{ color: colors[condition] }} />;
});

// ---- Main Component ----
export default function Weather() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('owm_api_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [hourly, setHourly] = useState<ForecastItem[]>([]);
  const [daily, setDaily] = useState<DailyForecast[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const convert = useCallback((temp: number) => unit === 'C' ? Math.round(temp) : Math.round(temp * 9 / 5 + 32), [unit]);

  // Fetch weather from OpenWeatherMap
  const fetchWeather = useCallback(async (query: string) => {
    if (!apiKey) {
      setError('API key required. Click the key icon to set your OpenWeatherMap API key.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Current weather
      const currentRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&units=metric&appid=${apiKey}`
      );
      if (!currentRes.ok) {
        if (currentRes.status === 401) throw new Error('Invalid API key');
        if (currentRes.status === 404) throw new Error(`City "${query}" not found`);
        throw new Error('API error');
      }
      const cData = await currentRes.json();

      setCurrent({
        city: cData.name,
        country: cData.sys.country,
        condition: mapOWMCondition(cData.weather[0].id),
        description: cData.weather[0].description,
        temp: cData.main.temp,
        feelsLike: cData.main.feels_like,
        humidity: cData.main.humidity,
        wind: Math.round(cData.wind.speed * 3.6), // m/s → km/h
        pressure: cData.main.pressure,
        visibility: Math.round((cData.visibility || 10000) / 1000),
        sunrise: formatUnixTime(cData.sys.sunrise, cData.timezone),
        sunset: formatUnixTime(cData.sys.sunset, cData.timezone),
        icon: cData.weather[0].icon,
      });

      // 5-day / 3-hour forecast
      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(query)}&units=metric&appid=${apiKey}`
      );
      if (forecastRes.ok) {
        const fData = await forecastRes.json();
        const items: ForecastItem[] = fData.list.slice(0, 12).map((f: any) => ({
          time: new Date(f.dt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
          temp: f.main.temp,
          condition: mapOWMCondition(f.weather[0].id),
          icon: f.weather[0].icon,
        }));
        setHourly(items);

        // Group by day for daily forecast
        const dayMap = new Map<string, { temps: number[]; condition: WeatherCondition }>();
        fData.list.forEach((f: any) => {
          const dayKey = new Date(f.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
          if (!dayMap.has(dayKey)) dayMap.set(dayKey, { temps: [], condition: mapOWMCondition(f.weather[0].id) });
          dayMap.get(dayKey)!.temps.push(f.main.temp_min, f.main.temp_max);
        });
        const dailyArr: DailyForecast[] = [];
        dayMap.forEach((v, k) => {
          dailyArr.push({ day: k, low: Math.min(...v.temps), high: Math.max(...v.temps), condition: v.condition });
        });
        setDaily(dailyArr.slice(0, 7));
      }

      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to fetch weather');
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  // Geolocation on mount
  useEffect(() => {
    if (!apiKey) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            setLoading(true);
            const res = await fetch(
              `https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&units=metric&appid=${apiKey}`
            );
            if (res.ok) {
              const data = await res.json();
              fetchWeather(data.name);
            }
          } catch {
            fetchWeather('Istanbul');
          }
        },
        () => fetchWeather('Istanbul')
      );
    } else {
      fetchWeather('Istanbul');
    }
  }, [apiKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchWeather(searchQuery.trim());
      setSearchQuery('');
    }
  };

  const handleSaveKey = () => {
    localStorage.setItem('owm_api_key', apiKey);
    setShowKeyInput(false);
    setError('');
    if (apiKey) fetchWeather('Istanbul');
  };

  const tempRange = daily.length > 0 ? {
    min: Math.min(...daily.flatMap(d => [d.low, d.high])) - 2,
    max: Math.max(...daily.flatMap(d => [d.low, d.high])) + 2,
  } : { min: 0, max: 40 };

  return (
    <div className="flex flex-col h-full custom-scrollbar overflow-y-auto" style={{ background: 'var(--bg-window)' }}>
      {/* Search Bar */}
      <div className="flex items-center gap-2 px-4 py-3 shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2 px-3" style={{ height: 36, borderRadius: 18, background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}>
          <Search size={14} style={{ color: 'var(--text-disabled)', flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search any city..."
            className="flex-1 bg-transparent outline-none"
            style={{ color: 'var(--text-primary)', fontSize: '13px' }}
          />
        </form>
        <button
          onClick={() => setUnit(unit === 'C' ? 'F' : 'C')}
          className="flex items-center justify-center rounded-lg transition-all hover:bg-[var(--bg-hover)] font-semibold"
          style={{ width: 36, height: 36, fontSize: '13px', color: 'var(--accent-primary)' }}
        >
          °{unit}
        </button>
        <button
          onClick={() => setShowKeyInput(!showKeyInput)}
          className="flex items-center justify-center rounded-lg transition-all hover:bg-[var(--bg-hover)]"
          style={{ width: 32, height: 32, color: apiKey ? 'var(--accent-success)' : 'var(--accent-warning)' }}
          title={apiKey ? 'API Key Set' : 'Set API Key'}
        >
          <Key size={14} />
        </button>
        <button
          onClick={() => current && fetchWeather(current.city)}
          className="flex items-center justify-center rounded-lg transition-all hover:bg-[var(--bg-hover)]"
          style={{ width: 32, height: 32 }}
        >
          <RefreshCw size={14} style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>

      {/* API Key Input */}
      {showKeyInput && (
        <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-titlebar)' }}>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="OpenWeatherMap API Key (free at openweathermap.org)"
            className="flex-1 bg-transparent outline-none text-xs"
            style={{ color: 'var(--text-primary)' }}
          />
          <button onClick={handleSaveKey} className="px-3 py-1 rounded text-xs font-medium text-white" style={{ background: 'var(--accent-primary)' }}>
            Save
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-2 text-xs" style={{ color: 'var(--accent-error)', background: 'rgba(244,67,54,0.08)' }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
        </div>
      )}

      {/* No API Key Welcome */}
      {!apiKey && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Cloud size={48} className="mb-4" style={{ color: 'var(--text-disabled)' }} />
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Real Weather Data</h2>
          <p className="text-xs mb-4 max-w-[280px]" style={{ color: 'var(--text-secondary)' }}>
            Get a free API key from <span style={{ color: 'var(--accent-primary)' }}>openweathermap.org/api</span> and click the 🔑 icon above to enter it.
          </p>
          <p className="text-[10px]" style={{ color: 'var(--text-disabled)' }}>
            1,000 free API calls per day • No credit card required
          </p>
        </div>
      )}

      {/* Current Weather */}
      {current && !loading && (
        <>
          <div className="flex flex-col items-center py-6">
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={16} style={{ color: 'var(--accent-primary)' }} />
              <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>{current.city}</h1>
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{current.country}</span>

            <div className="flex items-center gap-4 mt-4">
              <WeatherIcon condition={current.condition} size={72} />
              <div className="flex flex-col">
                <span style={{ fontSize: '48px', fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {convert(current.temp)}°
                </span>
                <span className="capitalize" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{current.description}</span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-4 gap-3 w-full px-6 mt-5" style={{ maxWidth: 400 }}>
              <DetailItem icon={Thermometer} label="Feels Like" value={`${convert(current.feelsLike)}°`} />
              <DetailItem icon={Droplets} label="Humidity" value={`${current.humidity}%`} />
              <DetailItem icon={Wind} label="Wind" value={`${current.wind} km/h`} />
              <DetailItem icon={Gauge} label="Pressure" value={`${current.pressure} hPa`} />
            </div>
            <div className="grid grid-cols-2 gap-3 w-full px-6 mt-3" style={{ maxWidth: 400 }}>
              <DetailItem icon={Eye} label="Visibility" value={`${current.visibility} km`} />
              <DetailItem icon={Sunrise} label="Sunrise" value={current.sunrise} />
            </div>
          </div>

          {/* Hourly Forecast */}
          {hourly.length > 0 && (
            <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>Hourly Forecast</h3>
              <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                {hourly.map((h, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 py-2 px-2 rounded-lg shrink-0"
                    style={{ width: 56, background: i === 0 ? 'var(--bg-selected)' : 'transparent' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{h.time}</span>
                    <WeatherIcon condition={h.condition} size={24} />
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{convert(h.temp)}°</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily Forecast */}
          {daily.length > 0 && (
            <div className="px-4 py-3 flex-1" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>Forecast</h3>
              <div className="flex flex-col gap-1">
                {daily.map((day, i) => (
                  <div key={i} className="flex items-center gap-3 px-2 py-2" style={{ height: 44, borderBottom: '1px solid var(--border-subtle)' }}>
                    <span className="w-12 shrink-0" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{day.day}</span>
                    <WeatherIcon condition={day.condition} size={22} />
                    <span className="w-8 text-right shrink-0" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{convert(day.low)}°</span>
                    <div className="flex-1 relative" style={{ height: 4, background: 'var(--border-subtle)', borderRadius: 2 }}>
                      <div className="absolute h-full rounded-full" style={{
                        left: `${((day.low - tempRange.min) / (tempRange.max - tempRange.min)) * 100}%`,
                        right: `${100 - ((day.high - tempRange.min) / (tempRange.max - tempRange.min)) * 100}%`,
                        background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                      }} />
                    </div>
                    <span className="w-8 text-right shrink-0" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>{convert(day.high)}°</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sunset + last updated */}
          <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sunset size={18} style={{ color: 'var(--accent-secondary)' }} />
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Sunset</div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{current.sunset}</div>
                </div>
              </div>
              {lastUpdated && (
                <span style={{ fontSize: '10px', color: 'var(--text-disabled)' }}>
                  Updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 py-2 rounded-lg" style={{ background: 'var(--bg-titlebar)' }}>
      <Icon size={16} style={{ color: 'var(--text-secondary)' }} />
      <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>{value}</span>
      <span style={{ fontSize: '10px', color: 'var(--text-disabled)' }}>{label}</span>
    </div>
  );
}
