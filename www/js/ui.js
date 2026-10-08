/* ui.js — тосты, нижние «шторки», подтверждения. Все слои закрываются кнопкой «Назад». */
'use strict';

const UI = (() => {
  const layers = [];       // стек открытых шторок
  let toastTimer = null;

  function toast(msg, ms = 2600) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), ms);
  }

  /**
   * Нижняя шторка.
   *   opts: { title, subtitle, body: HTMLElement|string, actions: [{label, kind, value, keepOpen, onClick}],
   *           dismissible=true, className }
   * Возвращает { el, body, close(value), done: Promise<value> }.
   */
  function sheet(opts) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    const sh = document.createElement('div');
    sh.className = 'sheet' + (opts.className ? ' ' + opts.className : '');
    sh.setAttribute('role', 'dialog');
    sh.setAttribute('aria-modal', 'true');

    let html = '<div class="grab" aria-hidden="true"></div>';
    if (opts.title) html += `<h2 class="sh-title">${escapeHtml(opts.title)}</h2>`;
    if (opts.subtitle) html += `<div class="sh-sub">${escapeHtml(opts.subtitle)}</div>`;
    html += '<div class="sh-body"></div>';
    if (opts.actions && opts.actions.length) html += '<div class="sh-actions"></div>';
    sh.innerHTML = html;

    const body = sh.querySelector('.sh-body');
    if (typeof opts.body === 'string') body.innerHTML = opts.body;
    else if (opts.body) body.appendChild(opts.body);

    const dismissible = opts.dismissible !== false;
    let resolveDone;
    const done = new Promise((r) => { resolveDone = r; });
    let closed = false;

    const layer = {
      dismissible,
      close(value) {
        if (closed) return;
        closed = true;
        const i = layers.indexOf(layer);
        if (i >= 0) layers.splice(i, 1);
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 220);
        if (typeof opts.onClose === 'function') { try { opts.onClose(value); } catch (e) { console.error(e); } }
        resolveDone(value);
      }
    };

    if (opts.actions && opts.actions.length) {
      const bar = sh.querySelector('.sh-actions');
      opts.actions.forEach((a) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn ' + (a.kind || 'ghost');
        b.textContent = a.label;
        if (a.id) b.id = a.id;
        b.addEventListener('click', async () => {
          if (a.onClick) {
            const r = await a.onClick(layer, b);
            if (r === false) return;                // обработчик отменил закрытие
          }
          if (!a.keepOpen) layer.close(a.value);
        });
        bar.appendChild(b);
      });
    }

    overlay.addEventListener('pointerdown', (e) => { overlay._down = (e.target === overlay); });
    overlay.addEventListener('click', (e) => { if (e.target === overlay && overlay._down && dismissible) layer.close(undefined); });

    overlay.appendChild(sh);
    document.body.appendChild(overlay);
    layers.push(layer);
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('show')));

    // поле ввода не должно прятаться под клавиатурой
    sh.addEventListener('focusin', (e) => {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) setTimeout(() => t.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300);
    });

    return { el: sh, body, close: layer.close, done };
  }

  function confirm({ title, text, ok = 'Подтвердить', cancel = 'Отмена', danger = false }) {
    const s = sheet({
      title, subtitle: text, className: 'sheet-compact',
      actions: [
        { label: cancel, kind: 'ghost', value: false },
        { label: ok, kind: danger ? 'danger' : 'primary', value: true }
      ]
    });
    return s.done.then((v) => v === true);
  }

  function notice({ title, text, ok = 'Понятно' }) {
    return sheet({ title, subtitle: text, className: 'sheet-compact', actions: [{ label: ok, kind: 'primary', value: true }] }).done;
  }

  /** Закрывает верхнюю шторку; true — если что-то закрыли. */
  function back() {
    const top = layers[layers.length - 1];
    if (!top) return false;
    if (top.dismissible) top.close(undefined);
    return true;
  }

  const hasLayers = () => layers.length > 0;

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') back(); });

  return { toast, sheet, confirm, notice, back, hasLayers };
})();
