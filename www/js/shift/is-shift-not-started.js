/* shift/is-shift-not-started.js
 * Смена ещё не началась к текущему моменту (даже если формально "не завершена" —
 * см. isShiftPending, который до этого не различал "ещё не началась" и "идёт").
 * Вместе с isShiftPending даёт полную градацию: не началась → идёт → завершена.
 */
function isShiftNotStarted(d){
  if(!d.start) return false;
  const base = parseDate(d.date);
  const sMin = timeToMin(d.start);
  const startDt = new Date(base.getFullYear(), base.getMonth(), base.getDate(), Math.floor(sMin/60), sMin%60);
  return startDt.getTime() > Date.now();
}
