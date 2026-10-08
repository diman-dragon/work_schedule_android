/* cloud.js — синхронизация с Google Диском.
 *
 *  • Вход: OAuth 2.0 «Device flow» (тип клиента «TVs and Limited Input devices»). Приложению
 *    не нужны SHA-1, Google Play Services или внешний сервер: показываем код, пользователь
 *    вводит его на google.com/device, приложение получает refresh-токен и дальше входит само.
 *  • Хранение: скрытая папка приложения на Диске (scope drive.appdata) — в обычном списке
 *    файлов Диска её не видно, другие приложения туда не заглядывают.
 *  • Шифрование: перед отправкой данные шифруются AES-256-GCM (ключ из пароля, PBKDF2) —
 *    Google хранит только шифртекст. Формат совместим с прежним веб-приложением.
 *  • Слияние: по дате дня; при расхождении одного и того же дня спрашиваем пользователя.
 *  • Синхронизация — только по нажатию кнопки, никаких фоновых отправок.
 */
'use strict';

const Cloud = (() => {
  const KEY = 'ws2.cloud';
  const SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
  const FILE_NAME = 'shift-schedule-sync.enc.json';
  const DEVICE_URL = 'https://oauth2.googleapis.com/device/code';
  const TOKEN_URL = 'https://oauth2.googleapis.com/token';
  const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
  const DRIVE = 'https://www.googleapis.com/drive/v3';
  const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';

  /* ---------------- состояние ---------------- */

  const defaults = () => ({ refresh: null, pass: null, clientId: '', clientSecret: '', lastSyncAt: 0, lastSyncedDataAt: 0 });
  let st = (() => {
    try { return Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { return defaults(); }
  })();
  const saveSt = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { console.error(e); } };

  let access = null, accessExp = 0;
  let busy = false, busyText = '', lastError = null;
  let activeTick = null;                     // опрос кода входа, если он сейчас идёт
  const listeners = [];
  const emit = () => listeners.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });

  const isConnected = () => !!st.refresh;
  const creds = () => ({
    clientId: st.clientId || (window.WS_CONFIG && WS_CONFIG.googleClientId) || '',
    clientSecret: st.clientSecret || (window.WS_CONFIG && WS_CONFIG.googleClientSecret) || ''
  });

  class CloudError extends Error {
    constructor(code, msg) { super(msg || code); this.code = code; }
  }

  function formatLast() {
    if (!st.lastSyncAt) return null;
    const d = new Date(st.lastSyncAt);
    const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const sod = new Date(); sod.setHours(0, 0, 0, 0);
    const diff = Math.floor((sod.getTime() - new Date(d).setHours(0, 0, 0, 0)) / 86400000);
    if (diff === 0) return 'сегодня ' + time;
    if (diff === 1) return 'вчера ' + time;
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) + ' ' + time;
  }

  function status() {
    if (busy) return { kind: 'busy', text: busyText || 'Синхронизация…' };
    if (!isConnected()) return lastError ? { kind: 'err', text: lastError } : { kind: 'none', text: 'Не подключено' };
    if (lastError) return { kind: 'err', text: lastError };
    const last = formatLast();
    if (Model.state.updatedAt > st.lastSyncedDataAt) {
      return { kind: 'warn', text: 'Есть несинхронизированные изменения' + (last ? ' · последняя синхронизация: ' + last : '') };
    }
    return last ? { kind: 'ok', text: 'Синхронизировано · ' + last } : { kind: 'warn', text: 'Подключено · нажмите «Синхронизировать»' };
  }

  /* ---------------- шифрование ---------------- */

  const b64enc = (bytes) => { let s = ''; bytes.forEach((b) => { s += String.fromCharCode(b); }); return btoa(s); };
  const b64dec = (str) => { const s = atob(str); const a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; };

  async function deriveKey(password, salt) {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  async function encrypt(obj, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const buf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(obj)));
    return JSON.stringify({ v: 1, salt: b64enc(salt), iv: b64enc(iv), data: b64enc(new Uint8Array(buf)) });
  }
  async function decrypt(payloadStr, password) {
    const p = JSON.parse(payloadStr);
    const key = await deriveKey(password, b64dec(p.salt));
    const buf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64dec(p.iv) }, key, b64dec(p.data));
    return JSON.parse(new TextDecoder().decode(buf));
  }
  const isDecryptError = (err) => !!err && (err.name === 'OperationError' || /OPERATION_FAILED|operation failed|decrypt/i.test(String(err.message || '')));

  /* ---------------- ошибки ---------------- */

  function oauthMsg(r) {
    const d = (r && r.data) || {};
    const e = d.error, desc = d.error_description || '';
    if (e === 'invalid_client') return 'неверный Client ID или Client secret (проверьте тип клиента: «Устройства с ограниченным вводом»)';
    if (e === 'invalid_scope') return 'Google не разрешил доступ к данным приложения — проверьте тип OAuth-клиента';
    if (e === 'access_denied') return 'доступ к Google Диску не разрешён';
    if (e === 'expired_token') return 'код входа истёк — начните заново';
    if (e === 'disabled_client') return 'OAuth-клиент отключён в Google Cloud';
    if (e === 'org_internal') return 'приложение доступно только внутри организации — в Google Cloud выберите тип «Внешний»';
    return (e ? e : 'ответ Google ' + (r && r.status)) + (desc ? ': ' + desc : '');
  }

  function describe(err) {
    const msg = String((err && err.message) || '');
    if (err && err.code === 'AUTH_EXPIRED') return 'вход в Google истёк — подключите Диск заново';
    if (err && err.code === 'CHANGED') return 'облако изменилось во время синхронизации — нажмите ещё раз';
    if (isDecryptError(err)) return 'неверный пароль шифрования или повреждён файл в облаке';
    if (/accessNotConfigured|has not been used|is disabled/i.test(msg)) return 'в проекте Google Cloud не включён Google Drive API';
    if (/Failed to fetch|NetworkError|network|Load failed|timeout|Unable to resolve/i.test(msg)) return 'нет связи с Google — проверьте интернет';
    if (/\b429\b|quota|rate.?limit/i.test(msg)) return 'Google временно ограничил запросы — попробуйте через минуту';
    if (/\b401\b|invalid credentials|unauthorized/i.test(msg)) return 'сессия Google истекла — нажмите ещё раз';
    if (/\b403\b|insufficient|forbidden/i.test(msg)) return 'нет доступа к Google Диску — проверьте разрешения';
    return 'не удалось синхронизироваться' + (msg ? ' (' + msg + ')' : '');
  }

  /* ---------------- OAuth ---------------- */

  async function ensureAccess(force) {
    if (!force && access && Date.now() < accessExp - 60000) return access;
    const c = creds();
    if (!st.refresh) throw new CloudError('AUTH_EXPIRED');
    const r = await Native.postForm(TOKEN_URL, {
      client_id: c.clientId, client_secret: c.clientSecret, refresh_token: st.refresh, grant_type: 'refresh_token'
    });
    if (r.status === 200 && r.data && r.data.access_token) {
      access = r.data.access_token;
      accessExp = Date.now() + (r.data.expires_in || 3600) * 1000;
      return access;
    }
    if (r.data && r.data.error === 'invalid_grant') {
      st.refresh = null; saveSt(); access = null;
      throw new CloudError('AUTH_EXPIRED');
    }
    throw new Error(oauthMsg(r));
  }

  function askCredentials(cur) {
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="hint" style="margin:0 0 12px">Данные OAuth-клиента из Google Cloud (тип «Устройства с ограниченным вводом»). Они сохранятся только на этом телефоне. Как их получить — в README, раздел «Google Диск».</div>
      <div class="field"><label for="cbId">Client ID</label><input id="cbId" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="…apps.googleusercontent.com" value="${escapeHtml(cur.clientId || '')}"></div>
      <div class="field" style="margin-top:12px"><label for="cbSecret">Client secret</label><input id="cbSecret" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="GOCSPX-…" value="${escapeHtml(cur.clientSecret || '')}"></div>`;
    let result = null;
    return UI.sheet({
      title: 'Ключи Google', body,
      actions: [
        { label: 'Отмена', kind: 'ghost' },
        {
          label: 'Далее', kind: 'primary',
          onClick: () => {
            const id = body.querySelector('#cbId').value.trim(), secret = body.querySelector('#cbSecret').value.trim();
            if (!id || !secret) { UI.toast('Заполните оба поля'); return false; }
            result = { clientId: id, clientSecret: secret };
          }
        }
      ]
    }).done.then(() => result);
  }

  function askPassword({ title, text, confirm }) {
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="field"><label for="cbPass">Пароль шифрования</label><input id="cbPass" type="password" autocomplete="off" placeholder="••••••••"></div>
      ${confirm ? '<div class="field" style="margin-top:12px"><label for="cbPass2">Повторите пароль</label><input id="cbPass2" type="password" autocomplete="off" placeholder="••••••••"></div>' : ''}
      <div class="hint">⚠️ Если забудете пароль, данные из облака восстановить не получится. На втором телефоне вводите тот же пароль.</div>`;
    let result = null;
    return UI.sheet({
      title: title || 'Пароль шифрования', subtitle: text, body,
      actions: [
        { label: 'Отмена', kind: 'ghost' },
        {
          label: 'Продолжить', kind: 'primary',
          onClick: () => {
            const p = body.querySelector('#cbPass').value;
            if (p.length < 4) { UI.toast('Пароль — не короче 4 символов'); return false; }
            if (confirm && p !== body.querySelector('#cbPass2').value) { UI.toast('Пароли не совпадают'); return false; }
            result = p;
          }
        }
      ]
    }).done.then(() => result);
  }

  /** Вход через код. Возвращает ответ токен-эндпоинта (access_token + refresh_token). */
  async function deviceLogin(c) {
    const r = await Native.postForm(DEVICE_URL, { client_id: c.clientId, scope: SCOPE });
    if (r.status !== 200 || !r.data || !r.data.device_code) throw new Error(oauthMsg(r));
    const dc = r.data;
    const url = dc.verification_url || dc.verification_uri || 'https://www.google.com/device';
    const deadline = Date.now() + (dc.expires_in || 1800) * 1000;
    let interval = Math.max(5, dc.interval || 5) * 1000;

    const body = document.createElement('div');
    body.innerHTML = `
      <ol class="steps">
        <li>Нажмите <b>«Открыть Google»</b> — код скопируется.</li>
        <li>Вставьте код на странице и войдите в аккаунт.</li>
        <li>Разрешите доступ к данным приложения на Диске и вернитесь сюда.</li>
      </ol>
      <div class="code">${escapeHtml(dc.user_code)}</div>
      <div class="waiting"><span class="spinner"></span><span>Жду подтверждения…</span></div>`;

    return new Promise((resolve, reject) => {
      let finished = false, polling = false, timer = null, sheet = null;
      const finish = (err, val) => {
        if (finished) return;
        finished = true; clearTimeout(timer); activeTick = null;
        if (sheet) sheet.close('done');
        if (err) reject(err); else resolve(val);
      };
      const schedule = () => { clearTimeout(timer); if (!finished) timer = setTimeout(tick, interval); };
      async function tick() {
        if (finished || polling) return;
        polling = true;
        try {
          if (Date.now() > deadline) return finish(new CloudError('EXPIRED', 'код входа истёк — начните заново'));
          const t = await Native.postForm(TOKEN_URL, {
            client_id: c.clientId, client_secret: c.clientSecret, device_code: dc.device_code,
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
          });
          if (t.status === 200 && t.data && t.data.access_token) return finish(null, t.data);
          const e = t.data && t.data.error;
          if (e === 'slow_down') interval += 5000;
          else if (e && e !== 'authorization_pending') return finish(new Error(oauthMsg(t)));
        } catch (err) {
          /* обрыв сети — просто пробуем в следующий раз */
        } finally {
          polling = false;
        }
        schedule();
      }
      activeTick = () => { clearTimeout(timer); tick(); };

      sheet = UI.sheet({
        title: 'Вход в Google', body,
        onClose: (v) => { if (!finished) finish(new CloudError('CANCEL', 'отменено')); },
        actions: [
          { label: 'Отмена', kind: 'ghost' },
          {
            label: 'Открыть Google', kind: 'primary', keepOpen: true,
            onClick: async () => {
              const copied = await Native.copyText(dc.user_code);
              UI.toast(copied ? 'Код скопирован — вставьте его на странице Google' : 'Введите код вручную');
              Native.openUrl(url);
              schedule();
            }
          }
        ]
      });
      schedule();
    });
  }

  /* ---------------- Google Drive ---------------- */

  async function driveFetch(url, opts = {}, retry = true) {
    const token = await ensureAccess();
    const res = await fetch(url, Object.assign({}, opts, { headers: Object.assign({}, opts.headers, { Authorization: 'Bearer ' + token }) }));
    if (res.status === 401 && retry) { access = null; await ensureAccess(true); return driveFetch(url, opts, false); }
    if (!res.ok) {
      let detail = '';
      try { const j = await res.json(); detail = (j.error && (j.error.message || (j.error.errors && j.error.errors[0] && j.error.errors[0].reason))) || ''; } catch (e) { /* не JSON */ }
      throw new Error(`Drive ${res.status}${detail ? ' — ' + detail : ''}`);
    }
    return res;
  }

  async function driveFind() {
    const q = `name='${FILE_NAME}' and trashed=false`;
    const url = `${DRIVE}/files?spaces=appDataFolder&q=${encodeURIComponent(q)}&fields=${encodeURIComponent('files(id,modifiedTime)')}&pageSize=10`;
    const j = await (await driveFetch(url)).json();
    return (j.files && j.files[0]) || null;
  }
  async function driveModified(id) {
    const j = await (await driveFetch(`${DRIVE}/files/${id}?fields=modifiedTime`)).json();
    return j.modifiedTime;
  }
  const driveDownload = async (id) => (await driveFetch(`${DRIVE}/files/${id}?alt=media`)).text();
  async function driveCreate(content) {
    const boundary = 'wsboundary' + Date.now();
    const meta = { name: FILE_NAME, parents: ['appDataFolder'], mimeType: 'application/json' };
    const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n` +
      `--${boundary}\r\nContent-Type: application/json\r\n\r\n${content}\r\n--${boundary}--`;
    const res = await driveFetch(`${UPLOAD}/files?uploadType=multipart&fields=id`, {
      method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body
    });
    return (await res.json()).id;
  }
  const driveUpdate = (id, content) => driveFetch(`${UPLOAD}/files/${id}?uploadType=media`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: content
  });

  /* ---------------- слияние ---------------- */

  const sigOf = (days, rate, garage) =>
    Object.keys(days).sort().map((k) => k + ':' + Model.daySig(days[k])).join(';') + '|' + rate + '|' + garage;

  async function fetchRemote() {
    const f = await driveFind();
    if (!f) return null;
    const enc = await driveDownload(f.id);
    let obj;
    for (;;) {
      try { obj = await decrypt(enc, st.pass); break; }
      catch (err) {
        if (!isDecryptError(err)) throw err;
        const p = await askPassword({ title: 'Пароль не подошёл', text: 'Введите пароль, которым зашифровано облако.' });
        if (!p) throw new CloudError('CANCEL', 'отменено');
        st.pass = p; saveSt();
      }
    }
    const parsed = Model.fromLegacy(obj);
    return { id: f.id, modifiedTime: f.modifiedTime, parsed, sig: sigOf(parsed.days, parsed.rate, parsed.garageMin) };
  }

  const describeDay = (d) => (d && d.start ? `${d.start}–${d.end}${d.bus ? ' · авт. ' + d.bus : ''}` : 'выходной');

  function askConflicts(conflicts) {
    const decisions = {};
    conflicts.forEach((c) => { decisions[c.iso] = 'local'; });
    const body = document.createElement('div');
    const draw = () => {
      body.innerHTML = `
        <div class="bulk"><button class="btn ghost small" data-all="local">Везде: телефон</button><button class="btn ghost small" data-all="remote">Везде: облако</button></div>
        <div class="card">${conflicts.map((c) => {
          const dt = parseIso(c.iso);
          return `<div class="conf"><div class="d">${dt.getDate()} ${MONTHS_GEN[dt.getMonth()]}, ${WEEKDAYS_FULL[weekdayIdx(dt)].toLowerCase()}</div>
            <div class="seg">
              <button class="${decisions[c.iso] === 'local' ? 'on' : ''}" data-iso="${c.iso}" data-v="local"><small>На телефоне</small>${escapeHtml(describeDay(c.local))}</button>
              <button class="${decisions[c.iso] === 'remote' ? 'on' : ''}" data-iso="${c.iso}" data-v="remote"><small>В облаке</small>${escapeHtml(describeDay(c.remote))}</button>
            </div></div>`;
        }).join('')}</div>`;
    };
    draw();
    body.addEventListener('click', (e) => {
      const all = e.target.closest('[data-all]');
      if (all) { conflicts.forEach((c) => { decisions[c.iso] = all.dataset.all; }); draw(); return; }
      const b = e.target.closest('[data-iso]');
      if (b) { decisions[b.dataset.iso] = b.dataset.v; draw(); }
    });
    return UI.sheet({
      title: 'Разные данные за один день',
      subtitle: `Дней с расхождением: ${conflicts.length}. Выберите, какую версию оставить.`,
      body, dismissible: false,
      actions: [{ label: 'Отмена', kind: 'ghost', value: null }, { label: 'Применить', kind: 'primary', value: 'ok' }]
    }).done.then((v) => (v === 'ok' ? decisions : null));
  }

  function mergeDays(local, remote, decisions) {
    const out = Object.assign({}, local);
    for (const iso of Object.keys(remote)) {
      const l = local[iso], r = remote[iso];
      if (!l) { out[iso] = r; continue; }
      if (Model.daySig(l) === Model.daySig(r)) continue;
      const lh = Model.dayHasUserData(l), rh = Model.dayHasUserData(r);
      if (!lh && rh) out[iso] = r;
      else if (lh && rh && decisions[iso] === 'remote') out[iso] = r;
    }
    return out;
  }

  function mergeSettings(remote) {
    const S = Model.state;
    const adopt = remote.rate != null && (remote.settingsAt > S.settingsAt || S.settingsAt === 0);
    if (!adopt) return { rate: S.rate, garageMin: S.garageMin, settingsAt: S.settingsAt };
    return { rate: remote.rate, garageMin: remote.garageMin != null ? remote.garageMin : S.garageMin, settingsAt: remote.settingsAt || 0 };
  }

  async function push(remote) {
    const enc = await encrypt(Model.toLegacy(), st.pass);
    if (remote) {
      if ((await driveModified(remote.id)) !== remote.modifiedTime) throw new CloudError('CHANGED');
      await driveUpdate(remote.id, enc);
    } else {
      if (await driveFind()) throw new CloudError('CHANGED');
      await driveCreate(enc);
    }
  }

  /* ---------------- публичные действия ---------------- */

  function setBusy(text) { busy = true; busyText = text; emit(); }
  function endBusy() { busy = false; busyText = ''; emit(); }

  async function sync() {
    if (!isConnected()) return connect();
    if (busy) return;
    lastError = null;
    setBusy('Синхронизация…');
    try {
      await ensureAccess();
      const remote = await fetchRemote();
      if (remote) {
        const local = Model.state.days;
        const conflicts = [];
        for (const iso of Object.keys(remote.parsed.days)) {
          const l = local[iso], r = remote.parsed.days[iso];
          if (l && Model.dayHasUserData(l) && Model.dayHasUserData(r) && Model.daySig(l) !== Model.daySig(r)) conflicts.push({ iso, local: l, remote: r });
        }
        let decisions = {};
        if (conflicts.length) {
          decisions = await askConflicts(conflicts);
          if (!decisions) { UI.toast('Синхронизация отменена'); return; }
        }
        const merged = mergeDays(local, remote.parsed.days, decisions);
        const settings = mergeSettings(remote.parsed);
        const S = Model.state;
        if (sigOf(merged, settings.rate, settings.garageMin) !== sigOf(S.days, S.rate, S.garageMin)) {
          Model.createBackup('перед синхронизацией');
          Model.applyMerged(merged, settings);
        }
      }
      const cur = Model.state;
      if (!remote || sigOf(cur.days, cur.rate, cur.garageMin) !== remote.sig) await push(remote);
      st.lastSyncAt = Date.now(); st.lastSyncedDataAt = Model.state.updatedAt; saveSt();
      UI.toast('Синхронизировано ✓');
    } catch (err) {
      if (err && err.code === 'CANCEL') { /* пользователь отказался — не ошибка */ }
      else {
        console.error('Ошибка синхронизации', err);
        lastError = describe(err);
        UI.toast('☁️ ' + lastError, 4200);
      }
    } finally {
      endBusy();
    }
  }

  async function connect() {
    if (busy) return;
    let c = creds();
    if (!c.clientId || !c.clientSecret) {
      const got = await askCredentials(c);
      if (!got) return;
      st.clientId = got.clientId; st.clientSecret = got.clientSecret; saveSt();
      c = creds();
    }
    let pass = st.pass;
    if (!pass) {
      pass = await askPassword({
        title: 'Пароль шифрования',
        text: 'Данные на Google Диске хранятся зашифрованными. Придумайте пароль (на втором телефоне вводите тот же).',
        confirm: true
      });
      if (!pass) return;
    }
    lastError = null;
    setBusy('Вход в Google…');
    try {
      const tokens = await deviceLogin(c);
      st.refresh = tokens.refresh_token; st.pass = pass; saveSt();
      access = tokens.access_token; accessExp = Date.now() + (tokens.expires_in || 3600) * 1000;
      if (!st.refresh) throw new Error('Google не выдал токен обновления — удалите доступ приложения в аккаунте Google и повторите');
    } catch (err) {
      endBusy();
      if (err && err.code === 'CANCEL') return;
      lastError = describe(err);
      UI.toast('☁️ ' + lastError, 4500);
      return;
    }
    endBusy();
    UI.toast('Google Диск подключён');
    await sync();
  }

  async function restore() {
    if (!isConnected() || busy) return;
    lastError = null;
    setBusy('Загрузка из облака…');
    try {
      await ensureAccess();
      const remote = await fetchRemote();
      if (!remote) { await UI.notice({ title: 'В облаке пусто', text: 'Файла с данными на Google Диске пока нет — сначала выполните синхронизацию на телефоне, где есть данные.' }); return; }
      const n = Object.values(remote.parsed.days).filter((d) => d.start).length;
      endBusy();
      const ok = await UI.confirm({
        title: 'Заменить данные из облака?',
        text: `В облаке ${n} ${pluralRu(n, ['смена', 'смены', 'смен'])}. Данные на этом телефоне будут заменены (копия сохранится).`,
        ok: 'Заменить', danger: true
      });
      if (!ok) return;
      setBusy('Загрузка из облака…');
      Model.replaceAll(remote.parsed, 'перед загрузкой из облака');
      st.lastSyncAt = Date.now(); st.lastSyncedDataAt = Model.state.updatedAt; saveSt();
      Calendar.today();
      UI.toast('Данные загружены из облака');
    } catch (err) {
      if (!(err && err.code === 'CANCEL')) { lastError = describe(err); UI.toast('☁️ ' + lastError, 4200); }
    } finally {
      endBusy();
    }
  }

  async function disconnect() {
    const ok = await UI.confirm({
      title: 'Отключить Google Диск?',
      text: 'Синхронизация на этом телефоне остановится, пароль и вход будут забыты. Файл в облаке и данные на телефоне останутся.',
      ok: 'Отключить', danger: true
    });
    if (!ok) return;
    try { if (st.refresh) await Native.postForm(REVOKE_URL, { token: st.refresh }); } catch (e) { /* не критично */ }
    st.refresh = null; st.pass = null; st.lastSyncAt = 0; st.lastSyncedDataAt = 0; saveSt();
    access = null; lastError = null;
    emit();
    UI.toast('Google Диск отключён');
  }

  const nudge = () => { if (activeTick) activeTick(); };

  return {
    isConnected, status, sync, connect, restore, disconnect, nudge,
    onChange: (fn) => listeners.push(fn),
    notify: emit,
    get hasCreds() { const c = creds(); return !!(c.clientId && c.clientSecret); }
  };
})();
