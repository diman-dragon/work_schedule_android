/* calendar/render.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
// ---------- КАЛЕНДАРЬ ----------
function render(key){
  if(!DATA[key]) key = order[0];
  currentKey = key;
  renderMonthsStrip();
  updateHeaderSub();
  const m = DATA[key];
  animateMinutesLed('totalHours', m.total_minutes);
  const worked = m.days.filter(d => d.start && !d.pending);
  animateNumberLed('shiftCount', worked.length);
  animateNumberLed('totalSum', m.total_sum, fmtNum);

  const grid = $('calGrid');
  grid.innerHTML = '';
  const firstOfMonth = new Date(m.year, m.month-1, 1);
  let offset = firstOfMonth.getDay();
  offset = (offset + 6) % 7;
  for(let i=0;i<offset;i++){
    const empty = document.createElement('div');
    empty.className = 'day empty';
    grid.appendChild(empty);
  }
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const isCurrentCalMonth = (m.year === today.getFullYear() && m.month === today.getMonth()+1);
  m.days.forEach((d, idx) => {
    const cell = document.createElement('div');
    const dayNum = parseInt(d.date.split('.')[0], 10);
    const dateObj = new Date(m.year, m.month-1, dayNum);
    const isToday = isCurrentCalMonth && dayNum === today.getDate();
    const isFuture = dateObj.getTime() > todayMidnight.getTime();
    let stateClass;
    if(d.start){ stateClass = d.pending ? (d.notStarted ? 'not-started' : 'pending-shift') : 'worked'; }
    else if(isFuture){ stateClass = 'future'; }
    else if(isToday){ stateClass = 'pending-today'; }
    else { stateClass = 'off'; }
    cell.className = 'day ' + stateClass + (isToday ? ' today' : '');
    cell.style.animationDelay = (Math.min(idx, 30) * 12) + 'ms';
    let inner = 
      `<div class="d-head"><span class="d-num">${dayNum}</span>`;
    if(d.start){
      if(d.notStarted) inner += `<span class="d-sum d-sum-notstarted">🕓 не началась</span>`;
      else if(d.pending) inner += `<span class="d-sum d-sum-pending">🟡 идёт</span>`;
      else inner += `<span class="d-sum">${fmtNum(d.sum)}<span class="d-sum-unit"> дин.</span></span>`;
    }
    inner += `</div><div class="d-body">`;
    let stateLabel;
    if(d.start){
      inner += `<div class="d-time"><span class="d-time-start">${escapeHtml(d.start)}</span><span class="d-time-sep">–</span><span class="d-time-end">${escapeHtml(d.end)}</span></div>`;
      inner += `<div class="d-dur">${minutesToHM(d.minutes)}</div>`;
      if(d.bus || d.route) inner += `<div class="d-divider"></div>`;
      if(d.bus) inner += `<div class="d-bus">🚌 <span class="d-tag">авт.</span> ${escapeHtml(d.bus)}</div>`;
      if(d.route) inner += `<div class="d-route">🧭 <span class="d-tag">маршр.</span> ${escapeHtml(d.route)}</div>`;
      if(d.notStarted) inner += `<div class="d-pending">начнётся в ${d.start}</div>`;
      else if(d.pending) inner += `<div class="d-pending">после ${d.end} доход будет учтён</div>`;
      stateLabel = d.notStarted
        ? `смена ${d.start}–${d.end} ещё не началась`
        : d.pending
          ? `смена ${d.start}–${d.end} ещё не закончилась, доход будет засчитан после ${d.end}`
          : `смена ${d.start}–${d.end}, ${fmtNum(d.sum)} дин.` + (d.bus || d.route ? `, автобус ${d.bus || '—'}, маршрут ${d.route || '—'}` : '');
    } else if(isFuture){
      inner += `<div class="d-off">—</div>`;
      stateLabel = 'ещё не наступил';
    } else if(isToday){
      inner += `<div class="d-off">Сегодня</div>`;
      stateLabel = 'сегодня, данные ещё не внесены';
    } else {
      inner += `<div class="d-off">выходной</div>`;
      stateLabel = 'выходной';
    }
    inner += `</div>`;
    cell.innerHTML = inner;
    cell.tabIndex = 0;
    cell.setAttribute('role', 'button');
    cell.setAttribute('aria-label', `${dayNum}, ${d.weekday}, ${stateLabel}`);
    if(d.sum && !d.pending) cell.dataset.sum = d.sum;
    cell.addEventListener('click', () => openModal(key, idx));
    cell.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openModal(key, idx); } });
    grid.appendChild(cell);
  });
}
