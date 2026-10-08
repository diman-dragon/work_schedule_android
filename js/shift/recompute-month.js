/* shift/recompute-month.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
function recomputeMonth(key){
  const m = DATA[key];
  let totalMin = 0, totalSum = 0;
  m.days.forEach(d => {
    recomputeDay(d);
    d.pending = !!(d.start && d.end && isShiftPending(d));
    // отдельно помечаем "ещё не началась" — подмножество "не завершена" (d.pending),
    // используется только для более точного статуса на плитке дня, на подсчёт
    // часов/дохода не влияет (они и так не считаются, пока d.pending === true)
    d.notStarted = !!(d.start && d.end && isShiftNotStarted(d));
    // пока смена не закончилась — она не входит ни в часы, ни в доход месяца
    if(d.minutes && !d.pending){ totalMin += d.minutes; totalSum += d.sum; }
  });
  m.total_minutes = totalMin;
  m.total_sum = Math.round(totalSum*100)/100;
}
