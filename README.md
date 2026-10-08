<div align="center">

# 🚌 Work Schedule

### A single-page, zero-backend timesheet & earnings tracker for shift workers

**[🇷🇺 Читать на русском →](README.ru.md)**

![Vanilla JS](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![No Build Step](https://img.shields.io/badge/Build%20Step-None-success?style=for-the-badge)
![PWA](https://img.shields.io/badge/PWA-Installable-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)
![Offline First](https://img.shields.io/badge/Offline-First-2ea44f?style=for-the-badge)
![Google Drive Sync](https://img.shields.io/badge/Sync-Google%20Drive%20(E2E%20Encrypted)-4285F4?style=for-the-badge&logo=googledrive&logoColor=white)
![Chart.js](https://img.shields.io/badge/Charts-Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)

**133 JS modules · 17 CSS layers · 1 `index.html` · 0 dependencies to install · 0 servers to run**

</div>

---

## ✨ What is this?

`work_schedule` is a **fully client-side web app** for tracking irregular work shifts (built with a bus driver's schedule in mind, but generic enough for any hourly job). Open it in a browser and you get a complete payroll & analytics console — no `npm install`, no backend, no database. Everything lives on your device, works **completely offline after the first visit**, and optionally syncs — **end-to-end encrypted, and only when you press the button** — across devices via Google Drive.

It answers three questions at a glance:

1. **When did I work, and for how long?** → interactive monthly calendar
2. **How much did I earn?** → live LED-style counters, computed automatically from an hourly rate
3. **What are my patterns?** → a full statistics dashboard with 10+ charts

```
┌──────────────────────────────────────────────────────────┐
│                     🚌  Рабочий график                     │
├──────────────────────────────────────────────────────────┤
│  [ Rate: 700/h ]  [Today] [🌙] [⋯ Data] [☁️ Sync 09:12]   │
├──────────────────────────────────────────────────────────┤
│   Timesheet            Statistics                         │
├──────────────────────────────────────────────────────────┤
│   ⏱ 172h 30m     💰 120,750     📅 21 shifts              │
├──────────────────────────────────────────────────────────┤
│   Mo  Tu  We  Th  Fr  Sa  Su                                │
│   ▢   ▢   ●   ●   ●   ▢   ▢     ● = shift   ▢ = day off     │
│   ●   ●   ▢   ●   ●   ●   ▢                                 │
│   ...                                                       │
└──────────────────────────────────────────────────────────┘
```

---

## 🧩 Feature matrix

| Category | What it does |
|---|---|
| 📅 **Interactive calendar** | Click any day to mark it worked/off, set start & end time, attach a bus/route, and attach a photo of the paper schedule. Swipe navigation between months on mobile. |
| ⏱ **Auto-computed everything** | Hours, minutes, and earnings recalculate live from `rate × time` the instant you edit a shift — including shifts that cross midnight, and a fixed 20-minute "garage return" time added to every shift (currently a constant in code, not a UI setting). |
| 🟡 **Live shift states** | Distinct visual states for *future*, *not started yet*, and *in progress — earnings not final* shifts, refreshed by a background watcher every minute. |
| 💡 **Smart suggestions** | Recently used shift times, bus numbers and routes are suggested as one-tap chips when editing a day, with a per-item "hide" you can always undo just by re-entering the value. |
| 🔥 **Earnings heatmap** | One click recolors the whole calendar by how much each day earned. |
| 📊 **Statistics dashboard** | Best day / best month, average shift length, effective hourly rate, weekday vs. weekend split, top-5 highest-earning shifts, shift-length distribution, weekly trend, most common start times, and per-bus / per-route breakdowns. |
| 📈 **10+ live charts** | Bar, line, and doughnut charts for hours, earnings, cumulative income, weekday patterns, and more — powered by Chart.js, loaded on demand (see *Performance* below). |
| 🖼 **Day photos** | Attach a photo of the physical shift schedule to any day (auto-compressed client-side before storage), with a full-screen lightbox viewer. |
| 🖨 **Print-ready timesheet** | One click produces a clean A4 printable table — perfect for HR or payroll submission. |
| 💾 **Import / export** | Full JSON backup/restore, CSV export for spreadsheets, and an automatic local backup safety net before destructive actions. |
| 📲 **Installable PWA** | Add-to-home-screen on Android/iOS with a proper app icon, standalone window, and full offline support — see *Offline & performance* below. |
| ☁️ **End-to-end encrypted cloud sync, on your terms** | Optional Google Drive sync — your data is encrypted with a password *before* it ever leaves the browser (Web Crypto API), so not even Google can read it. Sync happens **only when you tap the button**, never automatically in the background, and the app always shows *when it last succeeded*. |
| 🌗 **Themes & accessibility** | Light/dark theme toggle, `prefers-reduced-motion` support, full keyboard navigation, and ARIA roles throughout. |
| 📱 **Responsive design** | Two dedicated responsive breakpoints tuned for phones through desktops, with scrollable modals that never get clipped by short viewports. |

---

## ⚡ Offline & performance

This app is designed to open **instantly**, even with no signal at all:

- **A Service Worker (`sw.js`) precaches the entire app** — all HTML/CSS/JS and icons — on first visit. Every subsequent open is served straight from the device, with **zero network requests**.
- **No CDN dependencies.** Chart.js, its datalabels plugin, and the confetti animation library are vendored locally (`js/vendor/`) instead of being fetched from a CDN on every load — and even then, they're only loaded lazily, the moment you actually open the Statistics tab or save your first shift, not upfront.
- **The only thing that ever touches the network on its own initiative is a press of the "Sync" button.** Google's auth script is not loaded until that exact moment either. Opening the app, browsing the calendar, logging shifts, viewing stats — none of it requires connectivity.
- **Cache-busting versioning**: every asset is requested with a `?v=X.Y.Z` query string tied to `js/config/app-version.js`, so updating the app on your phone is guaranteed to fetch the new files instead of getting stuck on an old cached copy. Bumping the version (`bump-version.ps1`) updates it everywhere at once, including inside the Service Worker's own cache list.

---

## 🏗 Architecture

No framework, no bundler, no `package.json` — just **cleanly decomposed vanilla JS**, loaded as plain `<script>` tags in dependency order, and CSS split into numbered "layers" that build up the design system.

```
work_schedule/
├── index.html                  ← single entry point, wires up every module
├── sw.js                       ← Service Worker: offline cache (see above)
├── manifest.json                ← PWA manifest (icons, name, standalone display)
├── css/
│   ├── 00-tokens-and-reset.css     ← design tokens (colors, spacing, fonts)
│   ├── 01-header.css … 17-print-a4.css
│   └── ...                         ← 17 layered stylesheets, cascade by number
└── js/
    ├── init/            → app bootstrap, state init, first render, SW registration
    ├── data/             → load/save/validate/export JSON & CSV, local backups
    ├── shift/            → time math: minutes, midnight-crossing shifts, recompute
    ├── calendar/          → month grid rendering, swipe navigation
    ├── day-modal/          → the "edit a day" dialog + recent-times autocomplete
    ├── stats/               → all statistical aggregations
    ├── charts/               → Chart.js chart builders, lazy-load, shared styling
    ├── heatmap/               → earnings heatmap coloring
    ├── photo/                  → image compression, preview, lightbox
    ├── cloud/                   → Google Drive OAuth, AES encryption, push/pull sync
    ├── print/                     → A4 printable timesheet generator
    ├── modals/                     → generic confirm/prompt modal helpers
    ├── ui/                          → theming, toasts, tabs, LED-counter animations
    ├── config/                      → app version, month/weekday name tables (RU)
    ├── utils/                        → date parsing, currency/number formatting,
    │                                    shared lazy-script-loading helper
    └── vendor/                        → locally-hosted Chart.js, datalabels
                                          plugin, and confetti (see Offline above)
```

**Design philosophy:** every file does one thing — `compute-minutes.js` only computes minutes, `save-day-handler.js` only handles saving a day. This makes the codebase easy to audit, easy to hand off, and trivial to extend without any build tooling.

### Data flow

```
User edits a day  →  save-day-handler.js
                          │
                          ▼
                 recompute-day.js  (minutes, earnings)
                          │
                          ▼
                 recompute-month.js → recompute-all.js
                          │
             ┌────────────┼─────────────┐
             ▼            ▼              ▼
     render-calendar   build-stats   persist.js
     (LEDs, grid)      (dashboard)   (localStorage;
                                      cloud push only
                                      on explicit
                                      button press)
```

---

## 🔐 Cloud sync, explained

Sync is **fully optional**, **zero-trust by design**, and **never runs on its own**:

1. You sign in with Google (OAuth, read/write access to your own Drive only, requested only when you press "Sync").
2. You choose a password — it never leaves your device.
3. A key is derived from that password (`derive-key.js`) and used to **AES-encrypt** your schedule (`encrypt-for-cloud.js`) before upload.
4. Google Drive only ever stores an opaque encrypted blob; decryption happens locally (`decrypt-from-cloud.js`) after download.
5. Before overwriting your cloud copy with a *smaller* local dataset, the app checks the shift count on both sides and asks for confirmation — so a fresh install or a cleared browser can never silently wipe out months of synced history.
6. The app remembers and shows **when it last successfully synced**, so you always know whether your latest edits made it to the cloud.

If you forget the password, the encrypted backup simply can't be read by anyone — including the app itself.

---

## 🚀 Getting started

No installation required.

```bash
# Clone or download, then serve it locally
# (needed for the Service Worker and Google Drive OAuth to work correctly —
# browsers restrict both APIs to http(s):// origins, file:// won't do):
python3 -m http.server 8000
# → http://localhost:8000
```

A ready-made helper is included:

```powershell
.\start-localhost.ps1
```

**That's it.** Set your hourly rate in the top bar, click a day, log a shift — the calendar, LEDs, and stats update instantly. Install it to your home screen for a native-feeling app icon and fully offline use.

---

## 📦 Data & privacy

- Data is stored **locally first**, in `localStorage` — the app works fully offline, always.
- Nothing is sent anywhere unless you explicitly press the "Sync" button — there is no background or automatic network activity.
- You can export/import your entire schedule as JSON at any time (`💾 Save JSON` / `📂 Load JSON`), or export a CSV for Excel/Sheets.
- A one-click **"Quick backup"** creates a timestamped local safety copy before you do anything risky.

---

## 🛠 Tech stack

| Layer | Choice | Why |
|---|---|---|
| UI | Vanilla HTML/CSS/JS | Zero build step, opens from a single file, easy to self-host anywhere |
| Offline | Service Worker + Cache API | True offline-first behaviour, instant repeat opens |
| Charts | [Chart.js](https://www.chartjs.org/) + datalabels plugin | Lightweight, no framework lock-in, vendored locally and lazy-loaded |
| Storage | `localStorage` + Web Crypto API | Offline-first, private by default |
| Cloud sync | Google Drive API (OAuth), user-triggered only | Free, ubiquitous, no custom backend to maintain |

---

## 🗺 Roadmap ideas

- [ ] Multi-user / multi-profile support
- [ ] Configurable currency & locale (currently tuned for RSD / Russian UI)
- [ ] CSV import (currently export-only)
- [ ] Background periodic sync as an opt-in setting (still off by default)

---

<div align="center">

Built as a hand-decomposed, dependency-free single-page app — proof that you don't need a framework to ship something polished.

**[🇷🇺 Читать на русском →](README.ru.md)**

</div>