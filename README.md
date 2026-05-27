<p align="center">
  <img src="app/public/favicon.svg" width="100" alt="LinuxOS Web" />
</p>

<h1 align="center">LinuxOS Web</h1>

<p align="center">
  <strong>Tarayıcıda çalışan tam teşekküllü Linux masaüstü ortamı + Cloud Workspace</strong>
  <br />
  62 uygulama • Supabase Cloud Sync • PWA • 6 Tema • WCAG 2.1 AA
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-All%20Rights%20Reserved-red?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/React-19.2-61dafb?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-7.2-646CFF?style=flat-square&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Supabase-Cloud-3FCF8E?style=flat-square&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/PWA-Installable-7C4DFF?style=flat-square" alt="PWA" />
  <img src="https://img.shields.io/badge/WCAG-2.1%20AA-blue?style=flat-square" alt="WCAG" />
  <img src="https://img.shields.io/badge/i18n-EN%20%7C%20TR-orange?style=flat-square" alt="i18n" />
  <img src="https://img.shields.io/badge/Apps-62+-4CAF50?style=flat-square" alt="Apps" />
</p>

---

## 📖 İçindekiler

- [Genel Bakış](#-genel-bakış)
- [Özellikler](#-özellikler)
- [62 Uygulama](#-62-uygulama)
- [Cloud Workspace (Full SaaS)](#-cloud-workspace--full-saas)
- [Masaüstü Ortamı](#️-masaüstü-ortamı)
- [Akıllı Terminal](#-akıllı-terminal)
- [Pencere Yönetimi & Tiling](#-pencere-yönetimi--tiling)
- [Klavye Kısayolları](#️-klavye-kısayolları)
- [Tema & Kişiselleştirme](#-tema--kişiselleştirme)
- [Erişilebilirlik (A11y)](#-erişilebilirlik-a11y)
- [Çoklu Dil (i18n)](#-çoklu-dil-i18n)
- [Performans & PWA](#-performans--pwa)
- [Mimari](#️-mimari)
- [Kurulum](#-kurulum)
- [Lisans](#-lisans)

---

## 🌟 Genel Bakış

LinuxOS Web, gerçek bir Linux masaüstü deneyimini tamamen tarayıcı içinde sunan, **62 yerleşik uygulama** ile gelen ve **Supabase tabanlı Full SaaS Cloud Workspace**'e dönüşebilen bir web uygulamasıdır.

**Backend olmadan** çalışır (tüm veriler localStorage + IndexedDB'de). **Supabase yapılandırıldığında** otomatik olarak:
- ✅ Google / GitHub / Email ile gerçek kimlik doğrulama
- ✅ PostgreSQL veritabanı ile bulut senkronizasyonu
- ✅ Gerçek zamanlı multi-cihaz sync
- ✅ S3 uyumlu dosya depolama

---

## ✨ Özellikler

| Kategori | Detay |
|----------|-------|
| 🖥️ Masaüstü | GNOME-tarzı panel, macOS-tarzı dock, sürükle-bırak ikonlar |
| 📱 62 Uygulama | İş araçları, geliştirici araçları, medya, oyunlar, AI |
| ☁️ Cloud SaaS | Supabase Auth + PostgreSQL + Storage + Real-time |
| 🪟 Pencere Yönetimi | Snap (7 bölge), tiling (4 düzen), Alt+Tab, cascade |
| ⌨️ 18+ Kısayol | Tiling, snap, fullscreen, command palette, spotlight |
| 🎨 6 Tema | Default, Nord, Dracula, Solarized, Gruvbox, Tokyo Night |
| ♿ WCAG 2.1 AA | reduced-motion, high-contrast, focus-visible, ARIA |
| 🌍 i18n | İngilizce 🇬🇧 + Türkçe 🇹🇷 (sıfır bağımlılık) |
| 📊 FPS Monitor | Gerçek zamanlı performans göstergesi (system tray) |
| 💾 Session Persist | Sayfa yenilendiğinde açık pencereler geri gelir |
| 📦 Backup/Restore | Tüm workspace JSON olarak export/import |
| 📁 Drag & Drop | Desktop'a dosya sürükle → IndexedDB'ye kaydet |

---

## 📱 62 Uygulama

### 🏢 İş Araçları (7)
| Uygulama | Özellikler |
|----------|-----------|
| **Kanban Board** | Sürükle-bırak sütunlar, WIP limitleri, etiketler |
| **Dashboard Builder** | Sürükle-bırak widget'lar, grafikler, KPI kartları |
| **Invoice Generator** | Profesyonel fatura oluşturma, PDF export |
| **Time Tracker** | Proje bazlı süre takibi, raporlar |
| **Spreadsheet** | Formül motoru, hücre biçimlendirme, CSV/JSON export |
| **Wiki** | Markdown tabanlı bilgi tabanı, bağlantılı sayfalar |
| **Todo** | Alt görevler, etiketler, öncelik, CSV/JSON export |

### 📝 Üretkenlik (8)
| Uygulama | Özellikler |
|----------|-----------|
| **Calendar** | Ay/hafta/gün görünümü, **tekrarlayan etkinlikler**, .ics export |
| **Notes** | H1-H3 başlıklar, inline code, Markdown/HTML export |
| **Contacts** | Kişi yönetimi, arama, gruplar |
| **Email** | Simüle e-posta istemcisi |
| **Reminders** | Zamanlı hatırlatıcılar |
| **Chat** | Mesajlaşma arayüzü |
| **RSS Reader** | Besleme okuyucu |
| **Password Manager** | Şifreli kasa |

### 💻 Geliştirici Araçları (8)
| Uygulama | Özellikler |
|----------|-----------|
| **Terminal** | 30+ komut, pipe desteği, tab completion, AI çeviri |
| **Code Editor** | Sözdizimi vurgulama, satır numaraları |
| **Git Client** | Commit geçmişi, dal yönetimi |
| **API Tester** | REST API test aracı (Postman benzeri) |
| **JSON Formatter** | Güzelleştirme, doğrulama, ağaç görünümü |
| **Regex Tester** | Canlı regex eşleştirme |
| **Base64 Tool** | Kodlama/çözme aracı |
| **Network Tools** | Ping, port tarama simülasyonu |

### 🎨 Medya & Yaratıcılık (13)
Photo Editor, Drawing, Whiteboard, Image Gallery, Image Viewer, Music Player, Video Player, Voice Recorder, Screen Recorder, Color Palette, Color Picker, ASCII Art, Matrix Rain

### 📂 Sistem (8)
File Manager, Settings, System Monitor, Archive Manager, Document Viewer, FTP Client, Markdown Preview, Media Converter

### 🎮 Oyunlar (11)
Chess, Tetris, Snake, Minesweeper, 2048, Pong, Solitaire, Flappy Bird, TicTacToe, Memory, Sudoku

### 🤖 AI & Diğer (5+)
AI Chat, Browser, Weather, Clock, Calculator

---

## ☁️ Cloud Workspace — Full SaaS

LinuxOS Web, **Supabase** ile tam teşekküllü bir Cloud Workspace'e dönüşür.

### Mimari

```
┌─────────────────────────────────────────┐
│           React Frontend                │
│   ┌──────────────┐  ┌──────────────┐   │
│   │ useCloudSync │  │ LoginScreen  │   │
│   │ (offline-    │  │ (OAuth)      │   │
│   │  first hook) │  │              │   │
│   └──────┬───────┘  └──────┬───────┘   │
│          │                 │            │
│   ┌──────▼─────────────────▼───────┐   │
│   │          supabase.ts           │   │
│   │  • Auth (Google/GitHub/Email)  │   │
│   │  • PostgreSQL (app_data)       │   │
│   │  • Storage (user-files)        │   │
│   │  • Real-time (Postgres sub)    │   │
│   └────────────────┬───────────────┘   │
└────────────────────┼───────────────────┘
                     │
          ┌──────────▼──────────┐
          │      Supabase       │
          │  PostgreSQL + Auth  │
          │  + Storage + RLS    │
          └─────────────────────┘
```

### Dual-Mode Çalışma

| Mod | Açıklama |
|-----|----------|
| **Offline (varsayılan)** | Tüm veriler localStorage + IndexedDB'de. Sıfır yapılandırma. |
| **Cloud (Supabase)** | Gerçek auth, cloud sync, dosya depolama, multi-cihaz. |

### Cloud Kurulumu

1. [supabase.com](https://supabase.com) → Ücretsiz proje oluştur
2. Authentication → Google & GitHub provider'ları etkinleştir
3. SQL Editor → Schema'yı çalıştır (`src/lib/supabase.ts` dosyasındaki SQL)
4. **Settings → Cloud & Sync** → URL + anon key yapıştır
5. **Test Connection** → Bağlantıyı doğrula

### Cloud Sync Destekleyen Uygulamalar

Notes, Todos, Calendar, Kanban, Time Tracker, Wiki, Invoices, Dashboard, Contacts, Spreadsheet, Settings, File System

### PostgreSQL Schema (Row-Level Security)

```sql
-- Kullanıcı başına uygulama verisi (generic key-value)
CREATE TABLE app_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL,
  data_key TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, app_id, data_key)
);
ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their data" ON app_data
  FOR ALL USING (auth.uid() = user_id);
```

---

## 🖥️ Masaüstü Ortamı

### Boot Sırası
5 aşamalı gerçekçi boot animasyonu:
1. **BIOS Logo** → Üretici logosunu simüle eder
2. **Kernel Log** → Satır satır akan kernel mesajları
3. **Progress Bar** → İlerleme çubuğu
4. **Circle Transition** → Açılış geçiş efekti
5. **Desktop** → Masaüstü yüklenir

### Panel & Dock
- **Üst Panel** — GNOME-tarzı: Saat, Wi-Fi, Ses, Pil, ☁️ Cloud durumu, FPS monitor
- **Alt Dock** — macOS-tarzı: Otomatik gizle, sürükle-bırak, çalışan uygulama göstergeleri
- **Masaüstü** — Sürüklenebilir ikonlar, sağ tık menüsü, dosya sürükle-bırak

### Lock Screen
- Saat gösterimi, şifre girişi, yumuşak animasyon
- `Super+L` ile anında kilitleme

---

## 🧠 Akıllı Terminal

```bash
# 30+ Linux komutu
ls -la | grep .txt | wc -l
cat /home/user/Documents/welcome.txt
mkdir -p /tmp/test/deep/path

# Sistem bilgisi
neofetch    # ASCII art + sistem bilgisi
df -h       # Disk kullanımı
free -h     # Bellek durumu
uptime      # Çalışma süresi

# AI ile doğal dil → komut çevirisi
ai "download the latest logs"  →  curl -o logs.txt https://...
```

**Özellikler:**
- Tab auto-completion (komut + dosya/klasör)
- Pipe desteği (`|`)
- Renklendirme (ANSI renkleri)
- Komut geçmişi (↑/↓ tuşları)
- AI çeviri (Gemini / OpenAI API)

---

## 🪟 Pencere Yönetimi & Tiling

### Snap Bölgeleri (7)
Pencereyi ekran kenarına sürükleyerek yapıştırma:
- Sol yarı, sağ yarı, üst yarı
- Sol üst, sol alt, sağ üst, sağ alt

### Tiling Düzenleri (Ctrl+Shift+1/2/3/4)

| Kısayol | Düzen | Açıklama |
|---------|-------|----------|
| `Ctrl+Shift+1` | ▌▐ | 2 sütun — Pencereler yarı yarıya |
| `Ctrl+Shift+2` | ▌▌▐ | 3 sütun — Üçe bölme |
| `Ctrl+Shift+3` | ▚ | Quad (2x2) — 4 eşit bölge |
| `Ctrl+Shift+4` | ▌▐ | Master+Stack — Ana pencere %60, diğerleri yığılmış %40 |

### Diğer
- **Alt+Tab** — Pencere değiştirici (önizleme ile)
- **Cascade** — Tüm pencereleri kademelendirme
- **Minimize All** — `Super+D` ile tüm pencereleri küçültme
- **Session Persist** — Sayfa yenilendiğinde açık pencereler otomatik geri gelir

---

## ⌨️ Klavye Kısayolları

| Kısayol | İşlev |
|---------|-------|
| `Ctrl+Alt+T` | Terminal aç |
| `Ctrl+W` | Pencereyi kapat |
| `Alt+Tab` | Pencere değiştir |
| `Super+D` | Tümünü küçült (masaüstünü göster) |
| `Super+L` | Ekranı kilitle |
| `F11` | Tam ekran |
| `Ctrl+Space` | Spotlight arama |
| `Ctrl+Shift+P` | Command palette (70+ komut) |
| `Ctrl+/` | Kısayollar yardım menüsü |
| `Ctrl+Shift+←` | Pencereyi sola yapıştır |
| `Ctrl+Shift+→` | Pencereyi sağa yapıştır |
| `Ctrl+Shift+↑` | Pencereyi maksimize et |
| `Ctrl+Shift+↓` | Pencereyi geri küçült |
| `Ctrl+Shift+1` | 2 sütun tiling |
| `Ctrl+Shift+2` | 3 sütun tiling |
| `Ctrl+Shift+3` | Quad (2×2) tiling |
| `Ctrl+Shift+4` | Master + Stack tiling |
| `Escape` | Menüleri kapat |

---

## 🎨 Tema & Kişiselleştirme

### 6 Renk Teması

| Tema | Önizleme |
|------|----------|
| **Default** | `#7C4DFF` Mor tonları |
| **Nord** | `#88C0D0` Buz mavisi |
| **Dracula** | `#BD93F9` Mor/Pembe |
| **Solarized** | `#268BD2` Klasik mavi |
| **Gruvbox** | `#FE8019` Sıcak turuncu |
| **Tokyo Night** | `#7AA2F7` Gece mavisi |

### Kişiselleştirme
- 8 accent renk (Purple, Blue, Teal, Green, Yellow, Orange, Red, Pink)
- Dark / Light mod geçişi
- Özel duvar kağıdı desteği
- CSS custom properties ile tema değişikliği (re-render yok)

---

## ♿ Erişilebilirlik (A11y)

WCAG 2.1 AA uyumluluğu:

- **`prefers-reduced-motion`** — Hareket hassasiyeti olan kullanıcılar için tüm animasyonlar devre dışı
- **`prefers-contrast`** — Yüksek kontrastlı ekranlar için gelişmiş kenarlıklar
- **`focus-visible`** — Klavye odağı için belirgin halka göstergeleri
- **Skip-to-content** — Ekran okuyucular için atlama bağlantısı
- **ARIA rolleri** — `dialog`, `toolbar`, `banner` tüm pencere ve panellerde
- **`aria-label`** — Tüm etkileşimli öğelerde açıklayıcı etiketler
- **Settings → Accessibility** — Reduce Motion, High Contrast, Large Text, Keyboard Hints

---

## 🌍 Çoklu Dil (i18n)

- Sıfır bağımlılık i18n sistemi (`react-i18next` yok)
- Tarayıcı dilini otomatik algılar
- **Desteklenen diller:** İngilizce 🇬🇧 | Türkçe 🇹🇷
- Parametreli çeviriler: `t('greeting', { name: 'Seydi' })`
- Settings → Language ile anında değiştirme

---

## ⚡ Performans & PWA

### Performans
- **Lazy loading** — 62 uygulama `React.lazy()` ile talep üzerine yüklenir
- **ErrorBoundary** — Her pencere izole; bir uygulama çökse bile masaüstü çalışır
- **FPS Monitor** — System tray'de gerçek zamanlı FPS sayacı (>50 yeşil, >30 sarı, <30 kırmızı)
- **Bundle**: ~180KB initial + 10-35KB per lazy chunk

### PWA
- **Offline çalışır** — Service Worker ile tüm statik dosyalar önbelleğe alınır
- **Yüklenebilir** — Masaüstüne kısayol olarak eklenebilir
- **PWA Shortcuts** — Terminal, Kanban, Invoice, Time Tracker hızlı erişim
- **manifest.json** — 62+ uygulama bilgisi, kategori ve açıklamalar

### Veri Yönetimi
- **Workspace Backup** — Settings → About → Export Backup (JSON)
- **Workspace Restore** — Import Backup ile tüm veriyi geri yükle
- **Reset All Data** — Tek tıkla tüm verileri sıfırla

---

## 🏗️ Mimari

```
src/
├── apps/                 # 62 lazy-loaded uygulama
│   ├── registry.ts       # Uygulama tanımları (id, icon, size, category)
│   └── AppRouter.tsx     # React.lazy → per-app chunks
├── components/           # Shell bileşenleri
│   ├── WindowFrame       # Sürükle, boyutlandır, snap, ARIA
│   ├── Desktop           # İkonlar, dosya sürükle-bırak
│   ├── Dock              # macOS-tarzı dock
│   ├── TopPanel          # Panel + FPS + Cloud durumu
│   ├── LoginScreen       # OAuth + Guest login
│   ├── BootSequence      # 5 aşamalı boot
│   ├── LockScreen        # Kilitle + saat
│   ├── CommandPalette    # Ctrl+Shift+P fuzzy arama
│   ├── SpotlightSearch   # Ctrl+Space arama
│   └── ErrorBoundary     # Pencere başına crash izolasyonu
├── hooks/
│   ├── useOSStore        # Context + useReducer (30+ action)
│   ├── useFileSystem     # Sanal dosya sistemi (IndexedDB)
│   ├── useCloudSync      # Offline-first cloud sync hook
│   └── useIndexedDB      # IndexedDB persistence katmanı
├── lib/
│   └── supabase.ts       # Supabase client + Auth + DB + Storage
├── i18n/                 # Sıfır bağımlılık i18n (EN, TR)
├── types/                # TypeScript interfaces
└── __tests__/            # Vitest unit testleri
```

### Mimari Kararlar

| Karar | Gerekçe |
|-------|---------|
| Context + useReducer | Redux yerine — 15KB daha küçük bundle, tek state concern |
| React.lazy per-app | İlk yükleme ~180KB. 62 uygulamanın her biri talep üzerine yüklenir |
| ErrorBoundary per-window | Bir uygulama çökse bile masaüstü çalışır |
| Supabase over Firebase | Açık kaynak, PostgreSQL, vendor lock-in yok |
| Offline-first sync | `useCloudSync` — önce localStorage, sonra cloud'a sync |
| CSS custom properties | Tema değişikliği re-render gerektirmez |
| Custom i18n | react-i18next'ten 85KB daha hafif |

> Detaylı diyagramlar için [ARCHITECTURE.md](./ARCHITECTURE.md) dosyasına bakın.

---

## 🚀 Kurulum

### Gereksinimler
- Node.js 20+ ve npm 10+

### Geliştirme

```bash
cd app
npm install
npm run dev        # http://localhost:3000
```

### Build

```bash
npm run build      # Production build → app/dist/
npm run preview    # Production önizleme
```

### Test

```bash
npm run test           # Tüm testleri çalıştır
npm run test:watch     # İzleme modu
npm run test:coverage  # Kapsam raporu
```

### Deploy (GitHub Pages)

```bash
npm run build
# dist/ klasörünü GitHub Pages'e deploy edin
```

---

## 🔧 CI/CD

GitHub Actions pipeline (her push/PR'da):
1. **TypeScript** — `tsc --noEmit` (sıfır hata)
2. **Lint** — ESLint
3. **Build** — `vite build` (62 lazy chunk)
4. **Deploy** — GitHub Pages (main branch)

---

## 📝 Lisans

[![License: All Rights Reserved](https://img.shields.io/badge/license-All%20Rights%20Reserved-red?style=flat-square)](./LICENSE)

Bu proje **Tüm Hakları Saklıdır** lisansı altındadır.
Yalnızca görüntüleme ve eğitim amaçlı paylaşılmıştır.
Detaylar için [LICENSE](./LICENSE) dosyasına bakın.

---

<p align="center">
  <sub>Geliştirici: <a href="https://github.com/seydivakkas">@seydivakkas</a></sub>
</p>
