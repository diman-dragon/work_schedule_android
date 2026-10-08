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
  const AppPlugin = plugin('App');
  const SystemBars = plugin('SystemBars');

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

  return { isNative, saveAndShare, onBack, onResume, exitApp, setBarStyle };
})();
