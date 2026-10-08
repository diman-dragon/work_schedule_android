/* ui/data-menu-bindings.js
 * Выпадающее меню «⋯ Данные»: открытие по клику, закрытие по клику вне меню
 * или по выбору пункта. Закрытие по Escape вынесено в общий обработчик
 * modals/global-modal-keyboard.js — раньше было продублировано и здесь.
 */
const menuBtn = $('dataMenuBtn');
const dataMenu = $('dataMenu');
menuBtn?.addEventListener('click', e => {
  e.stopPropagation();
  const show = !dataMenu.classList.contains('show');
  dataMenu.classList.toggle('show', show);
  menuBtn.setAttribute('aria-expanded', String(show));
});
document.addEventListener('click', e => {
  if(dataMenu && dataMenu.classList.contains('show') && !dataMenu.contains(e.target) && e.target !== menuBtn){
    dataMenu.classList.remove('show');
    menuBtn.setAttribute('aria-expanded', 'false');
  }
});
dataMenu?.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
  dataMenu.classList.remove('show');
  menuBtn?.setAttribute('aria-expanded', 'false');
}));
