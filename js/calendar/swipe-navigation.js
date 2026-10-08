/* calendar/swipe-navigation.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
// свайп между месяцами по календарной сетке (для телефона)
let touchX = null, touchY = null;
const cal = $('calGrid');
cal?.addEventListener('touchstart', e => {
  const t = e.changedTouches[0];
  touchX = t.clientX; touchY = t.clientY;
}, {passive:true});
cal?.addEventListener('touchend', e => {
  if(touchX === null) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - touchX, dy = t.clientY - touchY;
  touchX = touchY = null;
  if(Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy)*1.25) moveMonth(dx < 0 ? 1 : -1);
}, {passive:true});
