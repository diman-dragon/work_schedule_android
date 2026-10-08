/* main.js — запуск приложения. */
'use strict';

window.WS_VERSION = '1.0.0';

const Theme = (() => {
  const KEY = 'ws2.theme';
  let pref = 'auto';
  try { pref = localStorage.getItem(KEY) || 'auto'; } catch (e) { /* ignore */ }
  const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;

  function apply() {
    const light = pref === 'light' || (pref === 'auto' && mq && mq.matches);
    document.documentElement.dataset.theme = light ? 'light' : 'dark';
    Native.setBarStyle(!light);
  }
  function set(p) {
    pref = p;
    try { localStorage.setItem(KEY, p); } catch (e) { /* ignore */ }
    apply();
  }
  if (mq && mq.addEventListener) mq.addEventListener('change', () => { if (pref === 'auto') apply(); });
  return { apply, set, get pref() { return pref; } };
})();

(function boot() {
  Theme.apply();
  Model.load();
  Calendar.init();
  $('menuBtn').innerHTML = Icons.menu;
  $('cloudBtn').innerHTML = Icons.cloud + '<i class="dot"></i>';

  const refreshCloudBtn = () => {
    const btn = $('cloudBtn');
    btn.hidden = !Cloud.isConnected();
    const k = Cloud.status().kind;
    btn.className = 'icon-btn cloud-btn ' + (k === 'busy' ? 'busy ' : '') + ({ ok: 'ok', warn: 'dirty', err: 'err' }[k] || '');
    btn.setAttribute('title', Cloud.status().text);
  };

  Model.onChange(() => { Calendar.render(); refreshCloudBtn(); });
  Cloud.onChange(refreshCloudBtn);

  $('menuBtn').addEventListener('click', Menu.open);
  $('rateChip').addEventListener('click', Menu.open);
  $('cloudBtn').addEventListener('click', () => Cloud.sync());

  Calendar.render();
  refreshCloudBtn();

  // кнопка «Назад»: закрыть шторку → вернуться к текущему месяцу → выйти
  Native.onBack(() => {
    if (UI.back()) return;
    const v = Calendar.view, n = new Date();
    if (v.y !== n.getFullYear() || v.m !== n.getMonth() + 1) { Calendar.today(); return; }
    Native.exitApp();
  });

  // возврат в приложение: перерисовать (мог смениться день/идущая смена) и проверить вход в Google
  Native.onResume(() => { Calendar.render(); refreshCloudBtn(); Cloud.nudge(); });

  // раз в минуту: смена закончилась → доход попадает в итоги сам
  let hadPending = Model.hasPending();
  setInterval(() => {
    const p = Model.hasPending();
    if (p || hadPending) Calendar.render();
    hadPending = p;
  }, 60000);

  const note = Model.loadNote;
  if (note) setTimeout(() => UI.toast(note, 5000), 400);
})();
