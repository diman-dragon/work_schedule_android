/* sw.js — Service Worker: делает приложение по-настоящему автономным.
 *
 * БЕЗ этого файла установленное на телефон приложение всё равно при каждом
 * открытии обращалось бы в сеть за index.html/css/js/иконками (или зависело
 * от непредсказуемого обычного HTTP-кеша браузера) — то есть открытие
 * "мгновенно, без интернета" было физически невозможно, даже если все
 * остальные внешние библиотеки убрать. Теперь все файлы приложения кладутся
 * в собственный кеш при установке и отдаются оттуда — открытие происходит
 * из памяти устройства, без единого сетевого запроса.
 *
 * СТРАТЕГИЯ: чистый cache-first, без фоновых проверок обновлений — ничего
 * не запрашивается в сети сама по себе, это было отдельным явным условием
 * ("в интернет только по кнопке Синхронизация"). Единственный момент, когда
 * этот файл сам уходит в сеть — при установке НОВОЙ версии (когда браузер,
 * будучи онлайн, обнаруживает, что sw.js на сервере изменился, и один раз
 * скачивает обновлённые файлы). Обычные открытия приложения сеть не трогают.
 *
 * ВАЖНО: версия кеша ниже должна совпадать с APP_VERSION в
 * js/config/app-version.js. bump-version.ps1 обновляет оба места сразу —
 * не меняйте это число вручную по отдельности.
 */
const CACHE_VERSION = '4.0.5';
const CACHE_NAME = 'wsched-cache-v' + CACHE_VERSION;

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "css/00-tokens-and-reset.css?v=4.0.5",
  "css/01-header.css?v=4.0.5",
  "css/02-month-strip.css?v=4.0.5",
  "css/03-display-panel.css?v=4.0.5",
  "css/05-calendar-grid.css?v=4.0.5",
  "css/06-modal-and-controls.css?v=4.0.5",
  "css/07-day-photo.css?v=4.0.5",
  "css/08-responsive-early.css?v=4.0.5",
  "css/09-today-state-and-focus.css?v=4.0.5",
  "css/10-compare-cards.css?v=4.0.5",
  "css/11-native-press-effect.css?v=4.0.5",
  "css/12-focus-ring-and-action-menu.css?v=4.0.5",
  "css/13-today-button-and-month-nav.css?v=4.0.5",
  "css/14-quick-actions-and-sync-status.css?v=4.0.5",
  "css/15-responsive-late.css?v=4.0.5",
  "css/16-reduced-motion.css?v=4.0.5",
  "css/17-print-a4.css?v=4.0.5",
  "js/utils/dollar-helper.js?v=4.0.5",
  "js/utils/load-script-once.js?v=4.0.5",
  "js/config/month-weekday-names.js?v=4.0.5",
  "js/data/build-empty-month.js?v=4.0.5",
  "js/data/validate-loaded-data.js?v=4.0.5",
  "js/data/repair-months-structure.js?v=4.0.5",
  "js/init/00-load-app-state.js?v=4.0.5",
  "js/data/sanitize-order.js?v=4.0.5",
  "js/init/01-app-state-variables.js?v=4.0.5",
  "js/data/persist-local-only.js?v=4.0.5",
  "js/data/persist.js?v=4.0.5",
  "js/config/app-version.js?v=4.0.5",
  "js/utils/escape-html.js?v=4.0.5",
  "js/utils/fmt-num.js?v=4.0.5",
  "js/utils/plural-ru.js?v=4.0.5",
  "js/utils/minutes-to-hm.js?v=4.0.5",
  "js/utils/time-to-min.js?v=4.0.5",
  "js/shift/compute-minutes.js?v=4.0.5",
  "js/utils/parse-date.js?v=4.0.5",
  "js/shift/shift-end-date-time.js?v=4.0.5",
  "js/shift/is-shift-pending.js?v=4.0.5",
  "js/shift/is-shift-not-started.js?v=4.0.5",
  "js/ui/led-anim-state.js?v=4.0.5",
  "js/ui/animate-raw.js?v=4.0.5",
  "js/ui/animate-number-led.js?v=4.0.5",
  "js/ui/animate-minutes-led.js?v=4.0.5",
  "js/shift/recompute-day.js?v=4.0.5",
  "js/shift/recompute-month.js?v=4.0.5",
  "js/shift/recompute-all.js?v=4.0.5",
  "js/init/02-initial-recompute-call.js?v=4.0.5",
  "js/data/sort-order-chronologically.js?v=4.0.5",
  "js/init/03-initial-sort-call.js?v=4.0.5",
  "js/utils/get-today-ym.js?v=4.0.5",
  "js/utils/is-today-key.js?v=4.0.5",
  "js/data/ensure-current-month-exists.js?v=4.0.5",
  "js/ui/tabs-bindings.js?v=4.0.5",
  "js/ui/switch-tab.js?v=4.0.5",
  "js/ui/update-header-sub.js?v=4.0.5",
  "js/heatmap/heatmap-toggle-bindings.js?v=4.0.5",
  "js/utils/hex-to-rgb.js?v=4.0.5",
  "js/utils/mix-rgb.js?v=4.0.5",
  "js/heatmap/warm-heat-color.js?v=4.0.5",
  "js/heatmap/apply-heatmap.js?v=4.0.5",
  "js/utils/css-var.js?v=4.0.5",
  "js/ui/apply-theme.js?v=4.0.5",
  "js/ui/theme-and-rate-bindings.js?v=4.0.5",
  "js/ui/month-button.js?v=4.0.5",
  "js/ui/render-months-strip.js?v=4.0.5",
  "js/calendar/render.js?v=4.0.5",
  "js/day-modal/day-modal-elements.js?v=4.0.5",
  "js/photo/day-photo-elements.js?v=4.0.5",
  "js/photo/compress-image-file.js?v=4.0.5",
  "js/photo/set-day-photo-preview.js?v=4.0.5",
  "js/photo/day-photo-input-bindings.js?v=4.0.5",
  "js/photo/open-photo-lightbox.js?v=4.0.5",
  "js/photo/day-photo-lightbox-bindings.js?v=4.0.5",
  "js/day-modal/open-modal.js?v=4.0.5",
  "js/day-modal/get-frequent-shift-times.js?v=4.0.5",
  "js/day-modal/render-recent-times.js?v=4.0.5",
  "js/day-modal/get-frequent-bus-routes.js?v=4.0.5",
  "js/day-modal/render-recent-bus-route.js?v=4.0.5",
  "js/day-modal/close-modal.js?v=4.0.5",
  "js/day-modal/update-preview.js?v=4.0.5",
  "js/day-modal/day-modal-basic-bindings.js?v=4.0.5",
  "js/ui/ensure-confetti-loaded.js?v=4.0.5",
  "js/day-modal/save-day-handler.js?v=4.0.5",
  "js/day-modal/add-month-open-bindings.js?v=4.0.5",
  "js/modals/promise-modal.js?v=4.0.5",
  "js/modals/confirm-modal.js?v=4.0.5",
  "js/modals/sync-pass-modal.js?v=4.0.5",
  "js/modals/global-modal-keyboard.js?v=4.0.5",
  "js/data/make-month-key.js?v=4.0.5",
  "js/day-modal/add-month-confirm-handler.js?v=4.0.5",
  "js/ui/show-toast.js?v=4.0.5",
  "js/data/save-json-file.js?v=4.0.5",
  "js/data/save-file-button-binding.js?v=4.0.5",
  "js/data/create-local-backup.js?v=4.0.5",
  "js/data/apply-loaded-json.js?v=4.0.5",
  "js/data/load-json-file.js?v=4.0.5",
  "js/data/load-file-button-bindings.js?v=4.0.5",
  "js/data/export-csv-handler.js?v=4.0.5",
  "js/data/clear-data-handler.js?v=4.0.5",
  "js/stats/iso-week-key.js?v=4.0.5",
  "js/stats/compute-stats.js?v=4.0.5",
  "js/stats/render-stat-cards.js?v=4.0.5",
  "js/stats/compute-month-comparisons.js?v=4.0.5",
  "js/stats/render-compare-cards.js?v=4.0.5",
  "js/charts/destroy-charts.js?v=4.0.5",
  "js/charts/chart-colors.js?v=4.0.5",
  "js/charts/base-options.js?v=4.0.5",
  "js/charts/money-label.js?v=4.0.5",
  "js/charts/hours-label.js?v=4.0.5",
  "js/charts/build-charts.js?v=4.0.5",
  "js/charts/ensure-chart-libs-loaded.js?v=4.0.5",
  "js/stats/build-stats.js?v=4.0.5",
  "js/cloud/00-cloud-state.js?v=4.0.5",
  "js/cloud/last-sync-time.js?v=4.0.5",
  "js/cloud/set-cloud-status.js?v=4.0.5",
  "js/cloud/describe-cloud-error.js?v=4.0.5",
  "js/cloud/b64-encode.js?v=4.0.5",
  "js/cloud/b64-decode.js?v=4.0.5",
  "js/cloud/derive-key.js?v=4.0.5",
  "js/cloud/encrypt-for-cloud.js?v=4.0.5",
  "js/cloud/decrypt-from-cloud.js?v=4.0.5",
  "js/cloud/ensure-token-client.js?v=4.0.5",
  "js/cloud/ensure-gis-loaded.js?v=4.0.5",
  "js/cloud/request-cloud-token.js?v=4.0.5",
  "js/cloud/drive-api-error.js?v=4.0.5",
  "js/cloud/drive-find-file.js?v=4.0.5",
  "js/cloud/drive-create-file.js?v=4.0.5",
  "js/cloud/drive-update-file.js?v=4.0.5",
  "js/cloud/drive-download-file.js?v=4.0.5",
  "js/cloud/day-fingerprints.js?v=4.0.5",
  "js/cloud/pull-from-cloud.js?v=4.0.5",
  "js/cloud/push-to-cloud.js?v=4.0.5",
  "js/cloud/is-cloud-sync-active.js?v=4.0.5",
  "js/cloud/run-full-sync.js?v=4.0.5",
  "js/cloud/connect-cloud-sync.js?v=4.0.5",
  "js/cloud/disconnect-cloud-sync.js?v=4.0.5",
  "js/cloud/cloud-buttons-bindings.js?v=4.0.5",
  "js/cloud/restore-from-cloud.js?v=4.0.5",
  "js/cloud/try-resume-cloud-sync.js?v=4.0.5",
  "js/cloud/initial-local-state.js?v=4.0.5",
  "js/modals/sync-conflict-modal.js?v=4.0.5",
  "js/init/bootstrap.js?v=4.0.5",
  "js/shift/pending-shift-watcher.js?v=4.0.5",
  "js/ui/data-menu-bindings.js?v=4.0.5",
  "js/ui/today-button-binding.js?v=4.0.5",
  "js/ui/move-month.js?v=4.0.5",
  "js/ui/render-wrap-month-label.js?v=4.0.5",
  "js/ui/keyboard-month-nav.js?v=4.0.5",
  "js/calendar/swipe-navigation.js?v=4.0.5",
  "js/print/print-month-handler.js?v=4.0.5",
  "js/data/backup-button-binding.js?v=4.0.5",
  "js/data/restore-backup-button-binding.js?v=4.0.5",
  "js/ui/backup-title-indicator.js?v=4.0.5",
  "js/ui/initial-month-nav-label.js?v=4.0.5",
  "js/init/register-service-worker.js?v=4.0.5",
  "manifest.json?v=4.0.5",
  "icons/apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "js/vendor/chart.umd.min.js?v=4.0.5",
  "js/vendor/chartjs-plugin-datalabels.min.js?v=4.0.5",
  "js/vendor/confetti.browser.min.js?v=4.0.5",
  "icons/icon-192-maskable.png",
  "icons/icon-512-maskable.png"
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Трогаем только собственные GET-запросы. Всё остальное (запросы к Google —
  // авторизация, Google Drive API, и вообще любой другой origin) идёт мимо
  // service worker'а напрямую в сеть, как обычно — это осознанно: кешировать
  // и тем более подменять чужие/облачные запросы не нужно и не нужно.
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if(cached) return cached;
      // Файла нет в кеше (например, версия sw.js ещё не обновилась на этом
      // устройстве, а в index.html уже появилась ссылка на новый файл) —
      // обычный сетевой запрос как запасной вариант, чтобы страница не сломалась.
      return fetch(req);
    })
  );
});
