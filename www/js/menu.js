/* menu.js — меню и экран настроек. */
'use strict';

const Menu = (() => {
  const item = (id, icon, title, sub, cls) =>
    `<button class="item ${cls || ''}" id="${id}"><span class="ic">${icon}</span><span class="tx"><b>${title}</b>${sub ? `<span>${sub}</span>` : ''}</span></button>`;

  function open() {
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="card">
        ${item('mSettings', Icons.gear, 'Настройки', 'ставка, довоз, тема, версия')}
      </div>
      <div class="menu-sec">Данные</div>
      <div class="card">
        ${item('mImport', Icons.down, 'Импорт из файла', 'JSON или CSV, в том числе из веб-версии')}
        ${item('mExportJson', Icons.up, 'Экспорт в JSON', 'полная копия графика')}
        ${item('mExportCsv', Icons.table, 'Экспорт в CSV', 'для Excel и таблиц')}
        ${item('mBackups', Icons.shield, 'Резервные копии', 'вернуть данные на прошлое состояние')}
        ${item('mClear', Icons.trash, 'Удалить все данные', '', 'danger')}
      </div>`;
    const sheet = UI.sheet({ title: 'Меню', body });
    const q = (id) => body.querySelector('#' + id);
    const act = (id, fn) => q(id).addEventListener('click', () => { sheet.close(); setTimeout(fn, 120); });
    act('mSettings', openSettings);
    act('mImport', DataIO.importFile);
    act('mExportJson', DataIO.exportJson);
    act('mExportCsv', DataIO.exportCsv);
    q('mBackups').addEventListener('click', DataIO.showBackups);
    act('mClear', DataIO.clearAll);
  }

  function openSettings() {
    const S = Model.state;
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="menu-sec">Расчёт</div>
      <div class="card pad">
        <div class="row">
          <div class="field"><label for="mRate">Ставка, дин./ч</label><input id="mRate" type="number" inputmode="decimal" min="0" step="1" value="${S.rate}"></div>
          <div class="field"><label for="mGarage">Довоз, мин</label><input id="mGarage" type="number" inputmode="numeric" min="0" max="180" step="1" value="${S.garageMin}"></div>
        </div>
        <div class="hint">Довоз до гаража добавляется к каждой смене по полной ставке. Новая ставка применяется к сменам, внесённым в этом приложении; значения, загруженные из старых файлов, не меняются.</div>
      </div>

      <div class="menu-sec">Тема</div>
      <div class="seg" id="mTheme">
        <button data-t="auto">Авто</button><button data-t="dark">AMOLED</button><button data-t="light">Светлая</button>
      </div>
      <div class="hint">AMOLED — чистый чёрный фон, светлая — тёплый светло-коричневый. «Авто» следует теме телефона.</div>

      <div class="menu-sec">О приложении</div>
      <div class="card">
        <div class="setrow"><b>Версия</b><span>${escapeHtml(window.WS_VERSION || '—')}</span></div>
        <div class="setrow"><b>Смен в памяти</b><span>${Model.countShifts()}</span></div>
      </div>`;
    const sheet = UI.sheet({ title: 'Настройки', body, actions: [{ label: 'Готово', kind: 'primary' }] });
    const q = (id) => body.querySelector('#' + id);

    const applySettings = () => {
      const rate = parseFloat(String(q('mRate').value).replace(',', '.'));
      const garage = parseInt(q('mGarage').value, 10);
      try {
        if (Model.setSettings(rate, garage)) UI.toast('Расчёт обновлён');
      } catch (err) {
        UI.toast('⚠️ ' + err.message);
        q('mRate').value = Model.state.rate; q('mGarage').value = Model.state.garageMin;
      }
    };
    q('mRate').addEventListener('change', applySettings);
    q('mGarage').addEventListener('change', applySettings);

    const markTheme = () => body.querySelectorAll('#mTheme button').forEach((b) => b.classList.toggle('on', b.dataset.t === Theme.pref));
    markTheme();
    q('mTheme').addEventListener('click', (e) => {
      const b = e.target.closest('[data-t]');
      if (b) { Theme.set(b.dataset.t); markTheme(); }
    });
    return sheet;
  }

  return { open, openSettings };
})();
