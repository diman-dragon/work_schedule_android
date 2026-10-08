/* modals/global-modal-keyboard.js
 * Единый обработчик клавиатуры для ВСЕХ модалок и выпадающего меню «⋯ Данные»:
 * Enter подтверждает, Escape закрывает верхний открытый слой.
 * Раньше это были два независимых обработчика Escape (этот + в data-menu-bindings.js),
 * которые местами дублировали друг друга — в частности, старый вариант в
 * data-menu-bindings.js закрывал модалки "в лоб" (просто снимал класс .show),
 * минуя клик по кнопке отмены, из-за чего Promise, которого ждёт
 * showConfirmModal()/promptSyncPassword(), никогда не резолвился, если модалку
 * закрывали именно через Escape. Здесь этот случай обработан правильно.
 * Каждая .modal-overlay помечена data-cancel-btn / data-confirm-btn — id соответствующих кнопок.
 */
document.addEventListener('keydown', (e) => {
  if(e.key !== 'Escape' && e.key !== 'Enter') return;

  if(e.key === 'Escape'){
    const dataMenu = $('dataMenu');
    if(dataMenu && dataMenu.classList.contains('show')){
      dataMenu.classList.remove('show');
      $('dataMenuBtn')?.setAttribute('aria-expanded', 'false');
    }
  }

  // если открыто несколько оверлеев одновременно (например, фото-лайтбокс поверх
  // модалки дня), берём самый последний в разметке — он же самый верхний по
  // рисованию (position:fixed, порядок в DOM = порядок наложения), чтобы Esc/Enter
  // всегда относился к тому окну, которое реально видит пользователь
  const openOverlays = document.querySelectorAll('.modal-overlay.show');
  if(!openOverlays.length) return;
  const openOverlay = openOverlays[openOverlays.length - 1];

  if(e.key === 'Escape'){
    e.preventDefault();
    const cancelBtn = $(openOverlay.dataset.cancelBtn);
    if(cancelBtn) cancelBtn.click();
  } else {
    // Enter: не перехватываем, если его уже обработал сам элемент (кнопка, time-chip)
    if(e.target.tagName === 'BUTTON' || (e.target.classList && e.target.classList.contains('time-chip'))) return;
    e.preventDefault();
    const confirmBtn = $(openOverlay.dataset.confirmBtn);
    if(confirmBtn) confirmBtn.click();
  }
});
