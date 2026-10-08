/* util.js — мелкие помощники без состояния */
'use strict';

const $ = (id) => document.getElementById(id);

const MONTHS_NOM = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const MONTHS_GEN = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const WEEKDAYS_FULL = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'];

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^(\d{2})\.(\d{2})\.(\d{4})$/;

const pad2 = (n) => String(n).padStart(2, '0');

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function pluralRu(n, forms) {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}

const fmtNum = (n) => (n == null || isNaN(n)) ? '—' : Math.round(n).toLocaleString('ru-RU');
const round2 = (x) => Math.round(x * 100) / 100;

/** «8 часов 20 минут» — однозначный формат (как в исходном приложении). */
function minutesToHM(mins) {
  if (mins == null || isNaN(mins)) return '—';
  const t = Math.round(mins), h = Math.floor(t / 60), m = t % 60;
  const hw = pluralRu(h, ['час', 'часа', 'часов']);
  const mw = pluralRu(m, ['минута', 'минуты', 'минут']);
  if (h === 0) return `${m} ${mw}`;
  if (m === 0) return `${h} ${hw}`;
  return `${h} ${hw} ${m} ${mw}`;
}

/** «8 ч 20 м» — компактный вариант для плиток. */
function minutesToShort(mins) {
  if (mins == null || isNaN(mins)) return '—';
  const t = Math.round(mins), h = Math.floor(t / 60), m = t % 60;
  return `${h} ч ${pad2(m)} м`;
}

const timeToMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

/** ISO-ключ дня: 2026-07-18 */
const isoOf = (y, m, d) => `${y}-${pad2(m)}-${pad2(d)}`;
const isoFromDate = (dt) => isoOf(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
function parseIso(iso) { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); }
const isoToRu = (iso) => { const [y, m, d] = iso.split('-'); return `${d}.${m}.${y}`; };
function ruToIso(s) {
  const m = DATE_RE.exec(s || '');
  if (!m) return null;
  const d = +m[1], mo = +m[2], y = +m[3];
  if (mo < 1 || mo > 12 || y < 2000 || y > 2100 || d < 1 || d > new Date(y, mo, 0).getDate()) return null;
  return isoOf(y, mo, d);
}
/** Индекс дня недели с понедельника: Пн=0 … Вс=6 */
const weekdayIdx = (dt) => (dt.getDay() + 6) % 7;

function nowStamp() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}_${pad2(d.getHours())}-${pad2(d.getMinutes())}`;
}

function cloneJson(v) { return JSON.parse(JSON.stringify(v)); }
