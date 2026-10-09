/* editor.js — шторка редактирования одного дня. */
'use strict';

const Editor = (() => {
  function open(iso) {
    const dt = parseIso(iso);
    const rec = Model.getDay(iso);
    const recentT = Model.recentTimes();

    // пустой день по умолчанию открывается как рабочий с последней использованной сменой
    let working = rec ? !!rec.start : true;
    let start = (rec && rec.start) || (recentT[0] && recentT[0].start) || '15:00';
    let end = (rec && rec.end) || (recentT[0] && recentT[0].end) || '23:00';

    const body = document.createElement('div');
    body.innerHTML = `
      <div class="switch-row"><span>Рабочий день</span>
        <button class="switch" id="edSwitch" role="switch" aria-checked="${working}" aria-label="Рабочий день"></button></div>
      <div id="edWork">
        <div class="chips-label" id="edTimesLbl">Недавние смены</div><div class="chips" id="edTimes"></div>
        <div class="row" style="margin-top:12px">
          <div class="field"><label for="edStart">Начало</label><input id="edStart" type="time" value="${start}" required></div>
          <div class="field"><label for="edEnd">Конец</label><input id="edEnd" type="time" value="${end}" required></div>
        </div>
        <div class="row" style="margin-top:12px">
          <div class="field"><label for="edBus">Автобус</label><input id="edBus" type="text" maxlength="40" placeholder="напр. 17" autocomplete="off" value="${escapeHtml((rec && rec.bus) || '')}"></div>
          <div class="field"><label for="edRoute">Маршрут</label><input id="edRoute" type="text" maxlength="40" placeholder="напр. А17" autocomplete="off" value="${escapeHtml((rec && rec.route) || '')}"></div>
        </div>
        <div class="chips" id="edBusChips" style="margin-top:8px"></div>
        <div class="chips" id="edRouteChips" style="margin-top:4px"></div>
        <div class="hint" id="edHint">Подсказки — три последних значения. Крестик убирает значение из подсказок.</div>
      </div>
      <div class="preview" id="edPreview"></div>`;

    const q = (id) => body.querySelector('#' + id);
    const sw = q('edSwitch'), work = q('edWork'), inS = q('edStart'), inE = q('edEnd'), inB = q('edBus'), inR = q('edRoute');

    const chip = (kind, val, label, main) =>
      `<span class="pick"><button type="button" class="pk-main" ${main}>${escapeHtml(label)}</button>` +
      `<button type="button" class="pk-x" data-x="${kind}" data-val="${escapeHtml(val)}" aria-label="Убрать из подсказок">×</button></span>`;
    function drawChips() {
      const times = Model.recentTimes(), buses = Model.recentBuses(), routes = Model.recentRoutes();
      q('edTimes').innerHTML = times.map((r) => chip('t', r.start + '|' + r.end, `${r.start}–${r.end}`, `data-s="${r.start}" data-e="${r.end}"`)).join('');
      q('edTimesLbl').hidden = !times.length;
      q('edBusChips').innerHTML = buses.map((v) => chip('b', v, 'авт. ' + v, `data-bus="${escapeHtml(v)}"`)).join('');
      q('edRouteChips').innerHTML = routes.map((v) => chip('r', v, 'марш. ' + v, `data-route="${escapeHtml(v)}"`)).join('');
      q('edHint').hidden = !(times.length || buses.length || routes.length);
    }
    drawChips();
    body.addEventListener('click', (e) => {
      const x = e.target.closest('[data-x]');
      if (x) { Model.hideSuggestion(x.dataset.x, x.dataset.val); drawChips(); return; }
      const m = e.target.closest('.pk-main');
      if (!m) return;
      if (m.dataset.s) { inS.value = m.dataset.s; inE.value = m.dataset.e; working = true; preview(); }
      else if (m.dataset.bus !== undefined) inB.value = m.dataset.bus;
      else if (m.dataset.route !== undefined) inR.value = m.dataset.route;
    });

    function preview() {
      const box = q('edPreview');
      work.hidden = !working;
      sw.setAttribute('aria-checked', String(working));
      if (!working) { box.innerHTML = '<span class="st">День отмечен как выходной</span>'; return; }
      if (!inS.value || !inE.value) { box.innerHTML = '<span class="st bad">Укажите время начала и конца смены</span>'; return; }
      if (inS.value === inE.value) { box.innerHTML = '<span class="st bad">Начало и конец совпадают — исправьте время</span>'; return; }
      const c = Model.calcShift(iso, inS.value, inE.value);
      const g = Model.state.garageMin;
      const garage = g ? ` (с довозом ${g} мин)` : '';
      const rel = `${pad2(c.endDt.getHours())}:${pad2(c.endDt.getMinutes())}`;
      if (c.pending && c.notStarted) {
        box.innerHTML = `<span class="st plan">🕓 Смена ещё не началась</span><br>Длительность: <b>${minutesToHM(c.minutes)}</b>${garage}<br>Будет: <b>${fmtNum(c.sum)} дин.</b>`;
      } else if (c.pending) {
        box.innerHTML = `<span class="st run">🟡 Смена идёт</span><br>Длительность: <b>${minutesToHM(c.minutes)}</b>${garage}<br>Засчитается после <b>${rel}</b>: <b>${fmtNum(c.sum)} дин.</b>`;
      } else {
        box.innerHTML = `<span class="st done">✅ Смена завершена</span><br>Длительность: <b>${minutesToHM(c.minutes)}</b>${garage}<br>Заработок: <b>${fmtNum(c.sum)} дин.</b>`;
      }
    }

    sw.addEventListener('click', () => { working = !working; preview(); });
    [inS, inE].forEach((el) => { el.addEventListener('input', preview); el.addEventListener('change', preview); });
    preview();

    UI.sheet({
      title: `${dt.getDate()} ${MONTHS_GEN[dt.getMonth()]} ${dt.getFullYear()}`,
      subtitle: WEEKDAYS_FULL[weekdayIdx(dt)],
      body,
      actions: [
        { label: 'Отмена', kind: 'ghost' },
        {
          label: 'Сохранить', kind: 'primary',
          onClick: () => {
            if (working) {
              if (!inS.value || !inE.value) { UI.toast('Укажите время начала и конца смены'); return false; }
              if (inS.value === inE.value) { UI.toast('Начало и конец смены совпадают'); return false; }
              Model.setDay(iso, { start: inS.value, end: inE.value, bus: inB.value, route: inR.value });
            } else {
              Model.setDay(iso, null);
            }
            UI.toast(working ? 'Смена сохранена' : 'Отмечено как выходной');
          }
        }
      ]
    });
  }

  return { open };
})();
