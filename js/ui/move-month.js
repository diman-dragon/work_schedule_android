/* ui/move-month.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
// навигация по месяцам
function moveMonth(delta){
  if(!order.length) return;
  const idx = order.indexOf(currentKey);
  const next = idx + delta;
  if(next >= 0 && next < order.length) render(order[next]);
  else showToast(delta < 0 ? 'Это самый ранний месяц' : 'Это самый поздний месяц');
}
$('prevMonthBtn')?.addEventListener('click', () => moveMonth(-1));
$('nextMonthBtn')?.addEventListener('click', () => moveMonth(1));
