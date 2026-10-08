/* shift/is-shift-pending.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
// смена ещё не завершилась к текущему моменту — доход по ней пока не засчитывается
function isShiftPending(d){
  const endDt = shiftEndDateTime(d);
  if(!endDt) return false;
  return endDt.getTime() > Date.now();
}
