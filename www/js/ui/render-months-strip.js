/* ui/render-months-strip.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
function renderMonthsStrip(){
  const {y: ty, m: tm} = getTodayYM();
  const todayIdx = ty*12+tm;
  const monthsEl = $('months');
  const pastEl = $('monthsPast');
  const pastDetails = $('pastMonthsDetails');
  monthsEl.innerHTML = '';
  pastEl.innerHTML = '';
  let pastCount = 0;
  order.forEach(key => {
    const m = DATA[key];
    const idx = m.year*12+m.month;
    const monthsAgo = todayIdx - idx; // 0 = текущий, 1 = прошлый, 2 = позапрошлый, 3+ = уходит в спойлер
    if(monthsAgo >= 3){
      pastEl.appendChild(monthButton(key));
      pastCount++;
    } else {
      monthsEl.appendChild(monthButton(key));
    }
  });
  $('pastMonthsSummary').textContent = `Прошедшие месяцы (${pastCount})`;
  pastDetails.style.display = pastCount ? '' : 'none';
}
