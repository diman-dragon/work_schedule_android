/* day-modal/update-preview.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
function updatePreview(){
  if(!workSwitch.classList.contains('on')){
    calcPreview.innerHTML = 'День отмечен как выходной';
    return;
  }
  if(startInput.value === endInput.value){
    calcPreview.innerHTML = '<span style="color:var(--weekend)">Начало и конец совпадают — укажите корректное время смены</span>';
    return;
  }
  const lineMin = computeMinutes(startInput.value, endInput.value);
  // довоз до гаража — фиксированные 20 минут на каждую смену, по полной ставке
  const mins = lineMin + GARAGE_RETURN_MIN;
  const perMinuteRate = Math.round((rate/60)*100)/100;
  const sum = Math.round(perMinuteRate * mins * 100)/100;

  // определяем реальные дату/время начала и конца смены (та дата, что редактируется,
  // а не "сегодня"), чтобы правильно показать один из трёх статусов; момент
  // реального освобождения — это конец линии + фиксированный довоз до гаража
  let startDt = null, endDt = null, releaseLabel = endInput.value;
  if(editingDay){
    const d = DATA[editingDay.key].days[editingDay.idx];
    const base = parseDate(d.date);
    const sMin = timeToMin(startInput.value), eMin = timeToMin(endInput.value);
    const dayOffset = (eMin <= sMin) ? 1 : 0;
    startDt = new Date(base.getFullYear(), base.getMonth(), base.getDate(), Math.floor(sMin/60), sMin%60);
    endDt = new Date(base.getFullYear(), base.getMonth(), base.getDate()+dayOffset, Math.floor(eMin/60), eMin%60);
    endDt.setMinutes(endDt.getMinutes() + GARAGE_RETURN_MIN);
    releaseLabel = `${String(endDt.getHours()).padStart(2,'0')}:${String(endDt.getMinutes()).padStart(2,'0')}`;
  }
  const now = new Date();
  const garageNote = ` (включая ${GARAGE_RETURN_MIN} мин довоза до гаража)`;

  if(startDt && startDt.getTime() > now.getTime()){
    calcPreview.innerHTML = `<span class="calc-status calc-status--future">🕓 Смена ещё не началась</span><br>Начало в <b>${escapeHtml(startInput.value)}</b> · длительность: <b>${minutesToHM(mins)}</b>${garageNote} · доход будет: <b>${fmtNum(sum)} дин.</b>`;
  } else if(endDt && endDt.getTime() > now.getTime()){
    calcPreview.innerHTML = `<span class="calc-status calc-status--pending">🟡 Смена идёт</span><br>Длительность: <b>${minutesToHM(mins)}</b>${garageNote} · доход будет засчитан после <b>${releaseLabel}</b>`;
  } else {
    calcPreview.innerHTML = `<span class="calc-status calc-status--done">✅ Смена завершена</span><br>Смена: <b>${minutesToHM(mins)}</b>${garageNote} &nbsp;·&nbsp; заработок: <b>${fmtNum(sum)} дин.</b>`;
  }
}
