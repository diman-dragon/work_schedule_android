/* shift/recompute-day.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
// recompute derived fields (minutes/hours/sum) for a single day based on start/end + rate.
// IMPORTANT: only days the user has actually edited (d.edited === true) get recalculated
// against the live rate. Original data loaded from the file keeps its numbers exactly as
// they were originally calculated, regardless of rate changes.
function recomputeDay(d){
  if(!d.edited) return;
  if(d.start && d.end){
    const lineMin = computeMinutes(d.start, d.end);
    // довоз до гаража после последней остановки — фиксированные 20 минут на
    // каждую смену, по той же полной ставке, что и рабочее время на линии
    d.minutes = lineMin + GARAGE_RETURN_MIN;
    d.hours = minutesToHM(d.minutes);
    // расчёт "как у них": поминутная ставка, округлённая до 2 знаков (напр.
    // 700/60 = 11,67), умноженная на общее число минут — а не деление часов
    // на дробную часть с округлением только в самом конце
    const perMinuteRate = Math.round((rate/60)*100)/100;
    d.sum = Math.round(perMinuteRate * d.minutes * 100)/100;
  } else {
    d.minutes = null; d.hours = null; d.sum = null;
  }
}
