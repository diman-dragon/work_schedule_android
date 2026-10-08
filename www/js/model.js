/* model.js — данные, расчёт смен, сохранение, перевод в/из формата исходного приложения.
 *
 * Внутренняя модель простая и «разреженная»: хранятся только дни, где пользователь что-то
 * вносил. Ключ — ISO-дата, поэтому «месяцев» как отдельных сущностей нет: листать календарь
 * можно куда угодно, а слияние с облаком идёт строго по дате дня.
 *
 *   S = {
 *     schema, rate, garageMin, settingsAt, updatedAt,
 *     days: { '2026-07-18': { start:'15:00', end:'23:00', bus:'17', route:'А17', edited:true } }
 *   }
 *
 * День без start, но с edited:true — «выходной, отмеченный вручную».
 * День с edited:false — это значения, пришедшие из старого файла: минуты и сумма в нём
 * заморожены (minutes/sum) и не пересчитываются при смене ставки — как и в исходном приложении.
 */
'use strict';

const Model = (() => {
  const STORE_KEY = 'ws2.data';
  const BACKUP_LIST_KEY = 'ws2.backups';
  const BACKUP_PREFIX = 'ws2.backup.';
  const BACKUP_KEEP = 5;
  const SCHEMA = 3;
  const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
  const MAX_MINUTES = 24 * 60 + 180;

  const fresh = () => ({ schema: SCHEMA, rate: 700, garageMin: 20, settingsAt: 0, updatedAt: 0, days: {} });
  let S = fresh();
  let loadNote = null;           // сообщение для показа после старта (если пришлось восстанавливаться)
  const listeners = [];

  /* ---------------- очистка/проверка ---------------- */

  function cleanStr(v) {
    if (typeof v !== 'string') return null;
    const t = v.trim().slice(0, 40);
    return t || null;
  }

  function cleanDay(d) {
    if (!d || typeof d !== 'object') return null;
    const okTimes = typeof d.start === 'string' && TIME_RE.test(d.start) && typeof d.end === 'string' && TIME_RE.test(d.end);
    if (okTimes) {
      const r = { start: d.start, end: d.end, edited: !!d.edited };
      const bus = cleanStr(d.bus), route = cleanStr(d.route);
      if (bus) r.bus = bus;
      if (route) r.route = route;
      if (!r.edited) {
        if (typeof d.minutes === 'number' && isFinite(d.minutes) && d.minutes >= 0 && d.minutes <= MAX_MINUTES) r.minutes = Math.round(d.minutes);
        if (typeof d.sum === 'number' && isFinite(d.sum) && d.sum >= 0) r.sum = d.sum;
      }
      return r;
    }
    if (d.edited) return { edited: true };
    return null;
  }

  function sanitizeState(raw) {
    if (!raw || typeof raw !== 'object' || !raw.days || typeof raw.days !== 'object' || Array.isArray(raw.days)) {
      throw new Error('повреждена структура данных');
    }
    const st = fresh();
    if (typeof raw.rate === 'number' && isFinite(raw.rate) && raw.rate >= 0 && raw.rate <= 1e6) st.rate = raw.rate;
    if (Number.isInteger(raw.garageMin) && raw.garageMin >= 0 && raw.garageMin <= 180) st.garageMin = raw.garageMin;
    st.settingsAt = Number(raw.settingsAt) || 0;
    st.updatedAt = Number(raw.updatedAt) || 0;
    for (const iso of Object.keys(raw.days)) {
      if (!ISO_RE.test(iso)) continue;
      const dt = parseIso(iso);
      if (isNaN(dt.getTime()) || isoFromDate(dt) !== iso || dt.getFullYear() < 2000 || dt.getFullYear() > 2100) continue;
      const c = cleanDay(raw.days[iso]);
      if (c) st.days[iso] = c;
    }
    return st;
  }

  /* ---------------- хранение ---------------- */

  function persist() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(S));
    } catch (err) {
      console.error('Не удалось сохранить данные', err);
      if (window.UI) UI.toast('⚠️ Не удалось сохранить: не хватает памяти устройства');
    }
  }

  function commit() {
    S.updatedAt = Date.now();
    persist();
    listeners.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
  }

  function onChange(fn) { listeners.push(fn); }

  function load() {
    let raw = null;
    try { raw = localStorage.getItem(STORE_KEY); } catch (e) { /* ignore */ }
    if (!raw) { S = fresh(); return; }
    try {
      S = sanitizeState(JSON.parse(raw));
    } catch (err) {
      console.error('Сохранённые данные повреждены', err);
      try { localStorage.setItem('ws2.corrupt.' + Date.now(), raw); } catch (e) { /* ignore */ }
      const list = listBackups();
      let restored = false;
      for (const b of list) {
        try {
          S = sanitizeState(JSON.parse(localStorage.getItem(b.key)).state);
          restored = true;
          break;
        } catch (e2) { /* пробуем следующий */ }
      }
      if (!restored) S = fresh();
      loadNote = restored
        ? '⚠️ Данные были повреждены — восстановлено из последней резервной копии'
        : '⚠️ Данные были повреждены, копий нет — начато с чистого листа (повреждённый файл сохранён отдельно)';
      persist();
    }
  }

  /* ---------------- резервные копии ---------------- */

  function createBackup(reason) {
    try {
      const key = BACKUP_PREFIX + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      localStorage.setItem(key, JSON.stringify({ at: new Date().toISOString(), reason: reason || 'авто', state: S }));
      let list = [];
      try { list = JSON.parse(localStorage.getItem(BACKUP_LIST_KEY) || '[]'); } catch (e) { list = []; }
      if (!Array.isArray(list)) list = [];
      list.unshift(key);
      while (list.length > BACKUP_KEEP) localStorage.removeItem(list.pop());
      localStorage.setItem(BACKUP_LIST_KEY, JSON.stringify(list));
      return true;
    } catch (err) {
      console.warn('Не удалось создать резервную копию', err);
      return false;
    }
  }

  function listBackups() {
    let keys = [];
    try { keys = JSON.parse(localStorage.getItem(BACKUP_LIST_KEY) || '[]'); } catch (e) { keys = []; }
    if (!Array.isArray(keys)) keys = [];
    const out = [];
    for (const key of keys) {
      try {
        const b = JSON.parse(localStorage.getItem(key));
        out.push({ key, at: b.at, reason: b.reason, shifts: Object.values(b.state.days || {}).filter((d) => d && d.start).length });
      } catch (e) { /* битую копию пропускаем */ }
    }
    return out;
  }

  function restoreBackup(key) {
    const raw = localStorage.getItem(key);
    if (!raw) throw new Error('копия не найдена');
    const st = sanitizeState(JSON.parse(raw).state);
    createBackup('перед восстановлением копии');
    S = st;
    commit();
  }

  /* ---------------- расчёт ---------------- */

  const lineMinutes = (start, end) => {
    const s = timeToMin(start);
    let e = timeToMin(end);
    if (e <= s) e += 1440;
    return e - s;
  };

  // как в исходном приложении: поминутная ставка округляется до копеек, потом умножается на минуты
  const calcSum = (minutes, rate) => round2(round2(rate / 60) * minutes);

  /** Расчёт для произвольных start/end (для предпросмотра в редакторе дня). */
  function calcShift(iso, start, end, now = Date.now()) {
    const minutes = lineMinutes(start, end) + S.garageMin;
    const base = parseIso(iso);
    const sM = timeToMin(start), eM = timeToMin(end);
    const startDt = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 0, sM);
    const endDt = new Date(base.getFullYear(), base.getMonth(), base.getDate() + (eM <= sM ? 1 : 0), 0, eM + S.garageMin);
    return {
      minutes, sum: calcSum(minutes, S.rate), endDt,
      pending: endDt.getTime() > now,
      notStarted: startDt.getTime() > now
    };
  }

  /** Итоги по дню или null, если смены нет. */
  function info(iso, now = Date.now()) {
    const d = S.days[iso];
    if (!d || !d.start || !d.end) return null;
    const c = calcShift(iso, d.start, d.end, now);
    if (!d.edited && typeof d.minutes === 'number') {
      c.minutes = d.minutes;
      c.sum = typeof d.sum === 'number' ? d.sum : calcSum(d.minutes, S.rate);
    }
    return c;
  }

  function monthStats(y, m, now = Date.now()) {
    const n = new Date(y, m, 0).getDate();
    let minutes = 0, sum = 0, shifts = 0, pendingEnd = null;
    for (let d = 1; d <= n; d++) {
      const iso = isoOf(y, m, d);
      const i = info(iso, now);
      if (!i) continue;
      if (i.pending) {
        if (!pendingEnd || i.endDt < pendingEnd) pendingEnd = i.endDt;
      } else {
        minutes += i.minutes; sum += i.sum; shifts++;
      }
    }
    return { minutes, sum: round2(sum), shifts, pendingEnd };
  }

  function hasPending(now = Date.now()) {
    for (const iso of Object.keys(S.days)) {
      const d = S.days[iso];
      if (d.start && d.end && calcShift(iso, d.start, d.end, now).pending) return true;
    }
    return false;
  }

  /* ---------------- действия ---------------- */

  const getDay = (iso) => S.days[iso] || null;

  /** data = {start,end,bus,route} — смена; data = null — выходной. */
  function setDay(iso, data) {
    if (data && data.start && data.end) {
      const r = { start: data.start, end: data.end, edited: true };
      const bus = cleanStr(data.bus), route = cleanStr(data.route);
      if (bus) r.bus = bus;
      if (route) r.route = route;
      S.days[iso] = r;
    } else {
      S.days[iso] = { edited: true };
    }
    commit();
  }

  function setSettings(rate, garageMin) {
    if (!(typeof rate === 'number' && isFinite(rate) && rate >= 0 && rate <= 1e6)) throw new Error('некорректная ставка');
    if (!(Number.isInteger(garageMin) && garageMin >= 0 && garageMin <= 180)) throw new Error('довоз: от 0 до 180 минут');
    if (rate === S.rate && garageMin === S.garageMin) return false;
    S.rate = rate; S.garageMin = garageMin; S.settingsAt = Date.now();
    commit();
    return true;
  }

  function clearAll() {
    createBackup('перед полной очисткой');
    S = Object.assign(fresh(), { rate: S.rate, garageMin: S.garageMin, settingsAt: S.settingsAt });
    commit();
  }

  /** Полная замена данных (импорт, загрузка из облака). parsed = результат fromLegacy(). */
  function replaceAll(parsed, reason) {
    createBackup(reason || 'перед заменой данных');
    S.days = parsed.days;
    if (parsed.rate != null) S.rate = parsed.rate;
    if (parsed.garageMin != null) S.garageMin = parsed.garageMin;
    S.settingsAt = parsed.settingsAt || S.settingsAt;
    commit();
  }

  /** Импорт «с объединением»: дни из файла перекрывают совпадающие даты, остальное не трогаем. */
  function mergeIn(days, reason) {
    createBackup(reason || 'перед объединением данных');
    Object.assign(S.days, days);
    commit();
  }

  /* ---------------- подсказки ---------------- */

  function recent(fn, limit) {
    const map = new Map();
    for (const iso of Object.keys(S.days)) {
      const d = S.days[iso];
      const val = fn(d);
      if (!val) continue;
      const e = map.get(val) || { val, count: 0, last: '' };
      e.count++;
      if (iso > e.last) e.last = iso;
      map.set(val, e);
    }
    return [...map.values()].sort((a, b) => (b.last < a.last ? -1 : b.last > a.last ? 1 : b.count - a.count)).slice(0, limit);
  }

  const recentTimes = (limit = 8) => recent((d) => (d.start && d.end ? d.start + '|' + d.end : null), limit)
    .map((e) => { const [start, end] = e.val.split('|'); return { start, end, count: e.count }; });
  const recentBuses = (limit = 6) => recent((d) => d.bus || null, limit).map((e) => e.val);
  const recentRoutes = (limit = 6) => recent((d) => d.route || null, limit).map((e) => e.val);

  /* ---------------- совместимость с форматом исходного приложения ---------------- */

  function betterDay(a, b) {
    const sa = !!a.start, sb = !!b.start;
    if (sa !== sb) return sa ? a : b;
    if (!!a.edited !== !!b.edited) return a.edited ? a : b;
    return a;
  }

  /** Разбор файла (JSON старого или нового приложения) → { days, rate, garageMin, settingsAt, skipped }. */
  function fromLegacy(obj) {
    if (!obj || typeof obj !== 'object' || !obj.months || typeof obj.months !== 'object' || Array.isArray(obj.months)) {
      throw new Error('в файле нет данных графика (поле months)');
    }
    const days = {};
    let skipped = 0;
    for (const key of Object.keys(obj.months)) {
      const m = obj.months[key];
      if (!m || !Array.isArray(m.days)) { skipped++; continue; }
      for (const d of m.days) {
        if (!d || typeof d !== 'object') { skipped++; continue; }
        const iso = ruToIso(d.date);
        if (!iso) { skipped++; continue; }
        const c = cleanDay(d);
        if (!c) {
          if (d.start || d.end) skipped++;      // «битая» смена; пустые дни — не ошибка
          continue;
        }
        days[iso] = days[iso] ? betterDay(days[iso], c) : c;   // дубли даты схлопываем
      }
    }
    const out = { days, skipped, rate: null, garageMin: null, settingsAt: Number(obj.settingsAt) || 0 };
    if (typeof obj.rate === 'number' && isFinite(obj.rate) && obj.rate >= 0 && obj.rate <= 1e6) out.rate = obj.rate;
    if (Number.isInteger(obj.garageMin) && obj.garageMin >= 0 && obj.garageMin <= 180) out.garageMin = obj.garageMin;
    return out;
  }

  /** Данные в формате, который читает и это приложение, и исходное веб-приложение. */
  function toLegacy(daysMap = S.days) {
    const monthIds = [...new Set(Object.keys(daysMap).map((iso) => iso.slice(0, 7)))].sort();
    const used = new Set();
    const months = {};
    const order = [];
    const savedDays = S.days;
    S.days = daysMap;               // info() читает S.days
    try {
      for (const id of monthIds) {
        const [y, m] = id.split('-').map(Number);
        const label = MONTHS_NOM[m - 1];
        let key = label, n = 2;
        if (used.has(key)) {
          const withYear = `${label} '${String(y).slice(2)}`;
          key = withYear;
          while (used.has(key)) key = `${withYear} (${n++})`;
        }
        used.add(key);
        const count = new Date(y, m, 0).getDate();
        const days = [];
        let totalMin = 0, totalSum = 0;
        for (let d = 1; d <= count; d++) {
          const iso = isoOf(y, m, d);
          const rec = {
            date: isoToRu(iso), weekday: WEEKDAYS_FULL[weekdayIdx(new Date(y, m - 1, d))],
            start: null, end: null, minutes: null, hours: null, sum: null, edited: false
          };
          const dd = daysMap[iso];
          if (dd) {
            rec.edited = !!dd.edited;
            if (dd.start) {
              const i = info(iso);
              rec.start = dd.start; rec.end = dd.end;
              rec.minutes = i.minutes; rec.hours = minutesToHM(i.minutes); rec.sum = i.sum;
              if (dd.bus) rec.bus = dd.bus;
              if (dd.route) rec.route = dd.route;
              if (!i.pending) { totalMin += i.minutes; totalSum += i.sum; }
            }
          }
          days.push(rec);
        }
        months[key] = { year: y, month: m, label, days, total_minutes: totalMin, total_sum: round2(totalSum) };
        order.push(key);
      }
    } finally {
      S.days = savedDays;
    }
    return {
      schemaVersion: 2, app: 'shift-schedule', exportedAt: new Date().toISOString(),
      rate: S.rate, garageMin: S.garageMin, settingsAt: S.settingsAt, updatedAt: S.updatedAt,
      currentKey: null, order, months
    };
  }

  function toCsv() {
    const rows = [['Месяц', 'Год', 'Дата', 'День недели', 'Начало', 'Конец', 'Длительность', 'Минут', 'Сумма, дин.', 'Автобус', 'Маршрут']];
    for (const iso of Object.keys(S.days).sort()) {
      const d = S.days[iso];
      if (!d.start) continue;
      const i = info(iso);
      const dt = parseIso(iso);
      rows.push([
        MONTHS_NOM[dt.getMonth()], dt.getFullYear(), isoToRu(iso), WEEKDAYS_FULL[weekdayIdx(dt)],
        d.start, d.end, minutesToHM(i.minutes), i.minutes, String(i.sum).replace('.', ','), d.bus || '', d.route || ''
      ]);
    }
    const csv = rows.map((r) => r.map((v) => {
      const s = String(v == null ? '' : v);
      return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(';')).join('\r\n');
    return '\uFEFF' + csv;
  }

  return {
    load, onChange, commit,
    get state() { return S; },
    get loadNote() { const n = loadNote; loadNote = null; return n; },
    getDay, setDay, setSettings, clearAll, replaceAll, mergeIn,
    info, calcShift, monthStats, hasPending,
    recentTimes, recentBuses, recentRoutes,
    createBackup, listBackups, restoreBackup,
    fromLegacy, toLegacy, toCsv,
    countShifts: () => Object.values(S.days).filter((d) => d.start).length,
    hasData: () => Object.values(S.days).some((d) => d.start),
    GARAGE_DEFAULT: 20
  };
})();
