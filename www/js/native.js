/* native.js — обёртка над Android-функциями Capacitor.
 * Приложение собирается без сборщика (webpack/vite), поэтому плагины подключаются
 * через Capacitor.registerPlugin(<имя>) — нативная часть при этом уже есть в APK.
 * В обычном браузере (для отладки) всё мягко деградирует.
 */
'use strict';

const Native = (() => {
  const C = window.Capacitor;
  const isNative = !!(C && typeof C.isNativePlatform === 'function' && C.isNativePlatform());
  const plugin = (name) => {
    if (!isNative) return null;
    try { return (C.Plugins && C.Plugins[name]) || C.registerPlugin(name); } catch (e) { return null; }
  };

  const Filesystem = plugin('Filesystem');
  const Share = plugin('Share');
  const Browser = plugin('Browser');
  const AppPlugin = plugin('App');
  const SystemBars = plugin('SystemBars');
  const Http = plugin('CapacitorHttp');

  /** POST application/x-www-form-urlencoded → { status, data } (data — объект или строка).
   *  На телефоне идёт через нативный HTTP-клиент: без ограничений CORS у OAuth-эндпоинтов Google. */
  async function postForm(url, fields) {
    if (Http) {
      const r = await Http.request({
        url, method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: fields
      });
      let data = r.data;
      if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) { /* оставляем строкой */ } }
      return { status: r.status, data: data || {} };
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(fields).toString()
    });
    let data = {};
    try { data = await res.json(); } catch (e) { /* пусто */ }
    return { status: res.status, data };
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(text); return true; }
    } catch (e) { /* пробуем запасной путь */ }
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch (e) { return false; }
  }

  function openUrl(url) {
    if (Browser) return Browser.open({ url });
    window.open(url, '_blank', 'noopener');
    return Promise.resolve();
  }

  /** Сохраняет текст во временный файл и открывает системное меню «Поделиться / Сохранить в…». */
  async function saveAndShare(filename, text, mime) {
    if (Filesystem && Share) {
      const w = await Filesystem.writeFile({ path: filename, data: text, directory: 'CACHE', encoding: 'utf8', recursive: true });
      try {
        await Share.share({ title: filename, dialogTitle: 'Сохранить или отправить файл', files: [w.uri] });
      } catch (err) {
        if (/cancel/i.test(String(err && (err.message || err)))) return 'cancelled';
        throw err;
      }
      return 'shared';
    }
    const blob = new Blob([text], { type: (mime || 'text/plain') + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return 'downloaded';
  }

  function onBack(handler) {
    if (AppPlugin) AppPlugin.addListener('backButton', handler);
  }
  function onResume(handler) {
    if (AppPlugin) AppPlugin.addListener('resume', handler);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) handler(); });
  }
  function exitApp() { if (AppPlugin) AppPlugin.exitApp(); }

  function setBarStyle(dark) {
    if (SystemBars) SystemBars.setStyle({ style: dark ? 'DARK' : 'LIGHT' }).catch(() => {});
  }

  return { isNative, postForm, copyText, openUrl, saveAndShare, onBack, onResume, exitApp, setBarStyle };
})();
