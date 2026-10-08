/* day-modal/render-recent-times.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
function renderRecentTimes(){
  const wrap = $('recentTimes');
  const freq = getFrequentShiftTimes();
  if(!freq.length){ wrap.innerHTML = ''; return; }
  wrap.innerHTML = '<div class="rt-label">недавние смены</div>' +
    freq.map(f => `<span class="time-chip" data-start="${escapeHtml(f.start)}" data-end="${escapeHtml(f.end)}" tabindex="0" role="button" aria-label="Подставить смену ${escapeHtml(f.start)}–${escapeHtml(f.end)}">${f.count > 1 ? `<span class="rt-count">${f.count}</span>` : ''}${escapeHtml(f.start)}–${escapeHtml(f.end)}<span class="rt-del" data-del-start="${escapeHtml(f.start)}" data-del-end="${escapeHtml(f.end)}" role="button" tabindex="0" aria-label="Убрать ${escapeHtml(f.start)}–${escapeHtml(f.end)} из подсказок" title="Убрать из подсказок">✕</span></span>`).join('');
  wrap.querySelectorAll('.time-chip').forEach(chip => {
    const apply = () => {
      startInput.value = chip.dataset.start;
      endInput.value = chip.dataset.end;
      if(!workSwitch.classList.contains('on')){
        workSwitch.classList.add('on');
        timeFields.style.display = 'block';
      }
      updatePreview();
    };
    chip.addEventListener('click', apply);
    chip.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); apply(); } });
  });
  // крестик "убрать из подсказок" — скрывает конкретную пару время-начало/время-конец
  // из списка навсегда (сохраняется между сессиями), сама история смен не меняется
  wrap.querySelectorAll('.rt-del').forEach(del => {
    const remove = (e) => {
      e.stopPropagation();
      hiddenShiftTimes.add(del.dataset.delStart + '–' + del.dataset.delEnd);
      persist();
      renderRecentTimes();
    };
    del.addEventListener('click', remove);
    del.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); remove(e); } });
  });
}
