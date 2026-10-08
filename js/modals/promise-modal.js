/* modals/promise-modal.js
 * Общий "движок" для модалок-подтверждений на основе Promise: показать окно,
 * дождаться выбора пользователя (кнопка / клик мимо / Escape — Escape обрабатывает
 * modals/global-modal-keyboard.js через data-cancel-btn/data-confirm-btn), скрыть,
 * ровно один раз зарезолвить сохранённый Promise.
 *
 * confirm-modal.js и sync-pass-modal.js раньше дублировали этот код почти дословно
 * (элементы, open/close, обработчики кнопок и клика мимо, resolve-once) — здесь он
 * вынесен один раз, а конкретные модалки лишь настраивают текст и значения.
 */
function createPromiseModal({ overlayId, cancelBtnId, okBtnId, focusId, cancelValue, okValue }){
  const overlay = $(overlayId);
  const cancelBtn = $(cancelBtnId);
  const okBtn = $(okBtnId);
  const focusEl = focusId ? $(focusId) : cancelBtn;
  let resolveFn = null;

  function resolveValue(v){ return typeof v === 'function' ? v() : v; }

  function close(result){
    overlay.classList.remove('show');
    if(resolveFn){ const r = resolveFn; resolveFn = null; r(result); }
  }
  function open(){
    overlay.classList.add('show');
    setTimeout(() => focusEl && focusEl.focus(), 50);
    return new Promise((resolve) => { resolveFn = resolve; });
  }

  cancelBtn.addEventListener('click', () => close(resolveValue(cancelValue)));
  okBtn.addEventListener('click', () => close(resolveValue(okValue)));
  overlay.addEventListener('click', (e) => { if(e.target === overlay) close(resolveValue(cancelValue)); });

  return { overlay, cancelBtn, okBtn, focusEl, open, close };
}
