/* ui/keyboard-month-nav.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
// навигация по месяцам с клавиатуры, если фокус не в текстовом поле
document.addEventListener('keydown', e => {
  const tag = (e.target?.tagName || '').toLowerCase();
  if(['input','textarea','select'].includes(tag)) return;
  // при открытой модалке (карточка дня, подтверждение и т.п.) месяц под ней не листаем:
  // editingDay указывает на прежний месяц, и сохранение записало бы день не туда
  if(document.querySelector('.modal-overlay.show')) return;
  if(e.key === 'ArrowLeft') moveMonth(-1);
  if(e.key === 'ArrowRight') moveMonth(1);
  if((e.key === 't' || e.key === 'т') && !e.ctrlKey && !e.metaKey){
    const key = ensureCurrentMonthExists();
    render(key);
  }
});
