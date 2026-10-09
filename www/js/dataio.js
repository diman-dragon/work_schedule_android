/* dataio.js — импорт/экспорт файлов, резервные копии, очистка. */
'use strict';

const DataIO = (() => {
  const MAX_FILE = 25 * 1024 * 1024;

  function pickFile() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';                       // без accept: на Android фильтр по .json часто прячет нужные файлы
      input.style.display = 'none';
      let settled = false;
      const finish = (v) => { if (!settled) { settled = true; input.remove(); resolve(v); } };
      input.addEventListener('change', async () => {
        const f = input.files && input.files[0];
        if (!f) return finish(null);
        if (f.size > MAX_FILE) { UI.toast('Файл слишком большой'); return finish(null); }
        try { finish({ name: f.name, text: await f.text() }); } catch (e) { UI.toast('Не удалось прочитать файл'); finish(null); }
      });
      input.addEventListener('cancel', () => finish(null));
      document.body.appendChild(input);
      input.click();
    });
  }

  async function exportJson() {
    if (!Model.hasData() && !Object.keys(Model.state.days).length) { UI.toast('Пока нечего экспортировать'); return; }
    const text = JSON.stringify(Model.toLegacy(), null, 2);
    try {
      const r = await Native.saveAndShare(`shift-schedule_${nowStamp()}.json`, text, 'application/json');
      if (r !== 'cancelled') UI.toast(r === 'downloaded' ? 'Файл сохранён' : 'Экспорт готов');
    } catch (err) {
      console.error(err);
      UI.toast('Не удалось экспортировать: ' + (err && err.message ? err.message : err));
    }
  }

  async function exportCsv() {
    if (!Model.hasData()) { UI.toast('Нет смен для экспорта'); return; }
    try {
      const r = await Native.saveAndShare(`shift-schedule_${nowStamp()}.csv`, Model.toCsv(), 'text/csv');
      if (r !== 'cancelled') UI.toast('CSV готов — открывается в Excel');
    } catch (err) {
      console.error(err);
      UI.toast('Не удалось экспортировать: ' + (err && err.message ? err.message : err));
    }
  }

  async function importFile() {
    const f = await pickFile();
    if (!f) return;
    let parsed;
    try {
      const txt = f.text.replace(/^\uFEFF/, '');
      parsed = /^\s*[\[{]/.test(txt) ? Model.fromLegacy(JSON.parse(txt)) : Model.fromCsv(txt);
    } catch (err) {
      await UI.notice({ title: 'Не удалось открыть файл', text: 'Нужен JSON или CSV, сохранённый этим приложением или прежним веб-приложением «Рабочий график».\n\nПричина: ' + (err && err.message ? err.message : err) });
      return;
    }
    const entries = Object.keys(parsed.days);
    const shifts = entries.filter((k) => parsed.days[k].start).length;
    if (!entries.length) { await UI.notice({ title: 'В файле нет данных', text: 'Смен и отмеченных выходных не найдено.' }); return; }
    const months = new Set(entries.map((k) => k.slice(0, 7))).size;
    const summary = `Файл «${f.name}»: ${shifts} ${pluralRu(shifts, ['смена', 'смены', 'смен'])} в ${months} ${pluralRu(months, ['месяце', 'месяцах', 'месяцах'])}` +
      (parsed.rate != null ? `, ставка ${fmtNum(parsed.rate)} дин./ч` : '') +
      (parsed.skipped ? `\nПропущено повреждённых записей: ${parsed.skipped}` : '') +
      '\nФотографии из старого приложения не переносятся.';

    let mode = 'replace';
    if (Model.hasData()) {
      mode = await UI.sheet({
        title: 'Импорт данных', subtitle: summary + '\n\nПеред импортом будет создана резервная копия.',
        className: 'sheet-compact',
        actions: [
          { label: 'Отмена', kind: 'ghost', value: null },
          { label: 'Объединить', kind: 'ghost', value: 'merge' },
          { label: 'Заменить', kind: 'primary', value: 'replace' }
        ]
      }).done;
      if (!mode) return;
    }
    if (mode === 'merge') Model.mergeIn(parsed.days, 'перед импортом (объединение)');
    else Model.replaceAll(parsed, 'перед импортом (замена)');
    Calendar.today();
    UI.toast(`Загружено: ${shifts} ${pluralRu(shifts, ['смена', 'смены', 'смен'])}`);
  }

  function fmtWhen(iso) {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  function showBackups() {
    const body = document.createElement('div');
    let sheet;
    const draw = () => {
      const list = Model.listBackups();
      body.innerHTML = list.length
        ? `<div class="card">${list.map((b) => `
            <div class="backup-row">
              <div class="tx"><b>${escapeHtml(fmtWhen(b.at))}</b><span>${escapeHtml(b.reason || '')} · смен: ${b.shifts}</span></div>
              <button class="btn ghost small" data-key="${escapeHtml(b.key)}">Вернуть</button>
            </div>`).join('')}</div>
          <div class="hint">Хранятся последние 5 копий. Они создаются автоматически перед импортом и очисткой.</div>`
        : '<div class="hint">Резервных копий пока нет.</div>';
    };
    draw();
    body.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-key]');
      if (!b) return;
      const ok = await UI.confirm({ title: 'Восстановить копию?', text: 'Текущие данные будут заменены (с них тоже сделается копия).', ok: 'Восстановить' });
      if (!ok) return;
      try { Model.restoreBackup(b.dataset.key); sheet.close(); Calendar.today(); UI.toast('Копия восстановлена'); }
      catch (err) { UI.toast('Не удалось восстановить: ' + err.message); }
    });
    sheet = UI.sheet({
      title: 'Резервные копии', body,
      actions: [
        { label: 'Закрыть', kind: 'ghost' },
        { label: 'Создать копию', kind: 'primary', keepOpen: true, onClick: () => { Model.createBackup('вручную'); draw(); UI.toast('Копия создана'); } }
      ]
    });
  }

  async function clearAll() {
    if (!Object.keys(Model.state.days).length) { UI.toast('Данные уже пусты'); return; }
    const ok = await UI.confirm({
      title: 'Удалить все данные графика?',
      text: 'Все смены будут удалены с этого телефона. Копия перед очисткой сохранится в резервных копиях.',
      ok: 'Удалить', danger: true
    });
    if (!ok) return;
    Model.clearAll();
    UI.toast('Данные удалены');
  }

  return { importFile, exportJson, exportCsv, showBackups, clearAll };
})();
