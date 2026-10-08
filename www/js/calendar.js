/* calendar.js — месячный календарь смен, итоги, выбор месяца, свайпы. */
'use strict';

const Calendar = (() => {
  const t0 = new Date();
  let view = { y: t0.getFullYear(), m: t0.getMonth() + 1 };

  const todayIso = () => isoFromDate(new Date());

  function cellHtml(y, m, d, now, tIso) {
    const iso = isoOf(y, m, d);
    const wd = weekdayIdx(new Date(y, m - 1, d));
    const rec = Model.getDay(iso);
    const inf = Model.info(iso, now);
    let cls = 'day' + (wd >= 5 ? ' we' : '') + (iso === tIso ? ' today' : '');
    let mid = '<span></span>', bot = '<span></span>';
    let label = `${d} ${MONTHS_GEN[m - 1]}, ${WEEKDAYS_FULL[wd].toLowerCase()}`;

    if (inf) {
      const times = `<span class="t"><b>${escapeHtml(rec.start)}</b>${escapeHtml(rec.end)}</span>`;
      mid = times;
      if (inf.pending && inf.notStarted) {
        cls += ' notstarted'; bot = '<span class="tag">позже</span>';
        label += `, смена ${rec.start}–${rec.end} ещё не началась`;
      } else if (inf.pending) {
        cls += ' pending'; bot = '<span class="tag">идёт</span>';
        label += `, смена ${rec.start}–${rec.end} идёт`;
      } else {
        cls += ' worked'; bot = `<span class="v">${fmtNum(inf.sum)}</span>`;
        label += `, смена ${rec.start}–${rec.end}, ${fmtNum(inf.sum)} динаров`;
      }
    } else if (rec && rec.edited) {
      cls += ' offmark'; bot = '<span class="tag">вых.</span>'; label += ', выходной';
    } else if (iso > tIso) {
      cls += ' future-empty'; label += ', нет данных';
    } else {
      cls += ' past-empty'; label += iso === tIso ? ', сегодня, нет данных' : ', нет смены';
    }
    return `<button class="${cls}" data-iso="${iso}" aria-label="${escapeHtml(label)}"><span class="n">${d}</span>${mid}${bot}</button>`;
  }

  function render(direction) {
    const { y, m } = view;
    const now = Date.now();
    const tIso = todayIso();
    const days = new Date(y, m, 0).getDate();
    const offset = weekdayIdx(new Date(y, m - 1, 1));

    let html = '';
    for (let i = 0; i < offset; i++) html += '<div class="day empty"></div>';
    for (let d = 1; d <= days; d++) html += cellHtml(y, m, d, now, tIso);
    const grid = $('grid');
    grid.innerHTML = html;
    if (direction) {
      grid.classList.remove('slide-next', 'slide-prev');
      void grid.offsetWidth;
      grid.classList.add(direction > 0 ? 'slide-next' : 'slide-prev');
    }

    $('monthName').textContent = MONTHS_NOM[m - 1];
    $('monthYear').textContent = y;

    const st = Model.monthStats(y, m, now);
    $('sumHours').textContent = st.minutes ? minutesToShort(st.minutes) : '0 ч';
    $('sumMoney').textContent = fmtNum(st.sum);
    $('sumShifts').textContent = st.shifts;

    const S = Model.state;
    $('rateChip').innerHTML = `Ставка <b>${fmtNum(S.rate)}</b> дин./ч · довоз <b>${S.garageMin}</b> мин`;

    // «сегодня» показываем, только если смотрим не текущий месяц
    $('todayBtn').hidden = (y === t0Now().y && m === t0Now().m);

    // идущая смена: сообщаем, когда она попадёт в итоги
    let runningEnd = null;
    for (let d = 1; d <= days; d++) {
      const i = Model.info(isoOf(y, m, d), now);
      if (i && i.pending && !i.notStarted && (!runningEnd || i.endDt < runningEnd)) runningEnd = i.endDt;
    }
    const note = $('pendingNote');
    if (runningEnd) {
      note.hidden = false;
      note.textContent = `Смена идёт — в итоги попадёт после ${pad2(runningEnd.getHours())}:${pad2(runningEnd.getMinutes())}`;
    } else {
      note.hidden = true;
    }
  }

  const t0Now = () => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() + 1 }; };

  function goTo(y, m, direction) {
    view = { y, m };
    render(direction);
  }
  function move(delta) {
    let { y, m } = view;
    m += delta;
    while (m < 1) { m += 12; y--; }
    while (m > 12) { m -= 12; y++; }
    if (y < 2000 || y > 2100) return;
    goTo(y, m, delta);
  }
  function today() {
    const n = t0Now();
    const dir = (n.y * 12 + n.m) - (view.y * 12 + view.m);
    goTo(n.y, n.m, dir === 0 ? 0 : (dir > 0 ? 1 : -1));
  }

  /* ---------- выбор месяца ---------- */
  function openPicker() {
    let year = view.y;
    const withShifts = new Set();
    Object.keys(Model.state.days).forEach((iso) => { if (Model.state.days[iso].start) withShifts.add(iso.slice(0, 7)); });
    const n = t0Now();

    const body = document.createElement('div');
    const draw = () => {
      let h = `<div class="yearbar"><button class="icon-btn" data-y="-1" aria-label="Предыдущий год">${Icons.left}</button><div class="y">${year}</div><button class="icon-btn" data-y="1" aria-label="Следующий год">${Icons.right}</button></div><div class="months">`;
      for (let m = 1; m <= 12; m++) {
        const cls = (year === view.y && m === view.m ? 'sel' : (year === n.y && m === n.m ? 'cur' : ''));
        h += `<button class="${cls}" data-m="${m}">${MONTHS_NOM[m - 1].slice(0, 3)}${withShifts.has(year + '-' + pad2(m)) ? '<i class="dt"></i>' : ''}</button>`;
      }
      body.innerHTML = h + '</div>';
    };
    draw();
    const sh = UI.sheet({ title: 'Выбор месяца', body, className: 'sheet-compact' });
    body.addEventListener('click', (e) => {
      const yb = e.target.closest('[data-y]');
      if (yb) { year = Math.max(2000, Math.min(2100, year + Number(yb.dataset.y))); draw(); return; }
      const mb = e.target.closest('[data-m]');
      if (mb) {
        const m = Number(mb.dataset.m);
        const dir = (year * 12 + m) - (view.y * 12 + view.m);
        sh.close();
        goTo(year, m, dir === 0 ? 0 : (dir > 0 ? 1 : -1));
      }
    });
  }

  function init() {
    $('prevBtn').innerHTML = Icons.left;
    $('nextBtn').innerHTML = Icons.right;
    $('prevBtn').addEventListener('click', () => move(-1));
    $('nextBtn').addEventListener('click', () => move(1));
    $('todayBtn').addEventListener('click', today);
    $('monthTitle').addEventListener('click', openPicker);

    $('grid').addEventListener('click', (e) => {
      const b = e.target.closest('.day[data-iso]');
      if (b) Editor.open(b.dataset.iso);
    });

    // свайп влево/вправо по календарю — следующий/предыдущий месяц
    let sx = null, sy = null;
    const area = document.querySelector('main');
    area.addEventListener('touchstart', (e) => { const t = e.changedTouches[0]; sx = t.clientX; sy = t.clientY; }, { passive: true });
    area.addEventListener('touchend', (e) => {
      if (sx === null) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - sx, dy = t.clientY - sy;
      sx = sy = null;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.4) move(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  return { init, render, goTo, today, move, get view() { return view; } };
})();
