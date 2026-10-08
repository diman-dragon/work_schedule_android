/* modals/sync-conflict-modal.js
 * Разбор конфликтов синхронизации по каждому изменённому дню.
 */
function formatConflictDay(day){
  if(!day) return 'нет записи';
  if(day.start || day.end){
    const bus = day.bus ? `авт. ${day.bus}` : 'автобус не указан';
    const route = day.route ? `маршрут ${day.route}` : 'маршрут не указан';
    const photo = day.photo ? ' · фото есть' : '';
    return `${day.start || '—'}–${day.end || '—'} · ${bus} · ${route}${photo}`;
  }
  return day.photo ? 'выходной · фото есть' : 'выходной';
}

async function showSyncConflicts(conflicts){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay show';
  overlay.id = 'syncConflictOverlay';
  overlay.dataset.cancelBtn = 'syncConflictCancelBtn';
  overlay.dataset.confirmBtn = 'syncConflictApplyBtn';
  overlay.innerHTML = `
    <div class="modal sync-conflict-modal">
      <h3>Конфликты синхронизации</h3>
      <div class="m-sub">В этих данных изменения есть и локально, и в облаке. Для каждого пункта выберите, какую версию сохранить.</div>
      <div class="sync-conflict-list"></div>
      <div class="modal-actions">
        <button class="btn btn-ghost" id="syncConflictCancelBtn" data-conflict-cancel>Отмена</button>
        <button class="btn btn-primary" id="syncConflictApplyBtn" data-conflict-apply>Применить выбранное</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const list = overlay.querySelector('.sync-conflict-list');
  conflicts.forEach((c, index) => {
    const item = document.createElement('div');
    item.className = 'sync-conflict-item';
    item.innerHTML = `
      <div class="sync-conflict-date">${escapeHtml(c.date)}</div>
      <div class="sync-conflict-cols">
        <div>
          <div class="sync-conflict-label">На этом устройстве</div>
          <div class="sync-conflict-value">${escapeHtml(formatConflictDay(c.local))}</div>
        </div>
        <div>
          <div class="sync-conflict-label">В облаке</div>
          <div class="sync-conflict-value">${escapeHtml(formatConflictDay(c.remote))}</div>
        </div>
      </div>
      <div class="sync-conflict-choice" role="group" aria-label="Версия для ${escapeHtml(c.date)}">
        <button type="button" class="btn btn-ghost sync-choice selected" data-choice="local" data-index="${index}">Оставить локальную</button>
        <button type="button" class="btn btn-ghost sync-choice" data-choice="remote" data-index="${index}">Взять из облака</button>
      </div>`;
    list.appendChild(item);
  });

  return new Promise((resolve) => {
    const choices = conflicts.map(() => 'local');
    const close = (result) => {
      overlay.remove();
      resolve(result);
    };
    list.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-choice]');
      if(!btn) return;
      const index = Number(btn.dataset.index);
      choices[index] = btn.dataset.choice;
      btn.parentElement.querySelectorAll('[data-choice]').forEach(x => x.classList.toggle('selected', x === btn));
    });
    overlay.querySelector('[data-conflict-cancel]').addEventListener('click', () => close(null));
    overlay.querySelector('[data-conflict-apply]').addEventListener('click', () => close(choices));
    overlay.addEventListener('click', e => { if(e.target === overlay) close(null); });
  });
}
