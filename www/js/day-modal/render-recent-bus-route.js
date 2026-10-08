/* day-modal/render-recent-bus-route.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
// подстановка недавних значений поля (автобус/маршрут) по клику на чип;
// используется и для recentBuses, и для recentRoutes — логика идентична,
// отличается только исходный список значений, контейнер, связанный инпут,
// набор скрытых значений и функция повторного рендера (нужна крестику "✕")
function renderRecentFieldChips(containerId, items, input, label, hiddenSet, rerender){
  const wrap = $(containerId);
  if(!wrap) return;
  if(!items.length){ wrap.innerHTML = ''; return; }
  wrap.innerHTML = `<div class="rt-label">${escapeHtml(label)}</div>` +
    items.map(f => `<span class="time-chip" data-value="${escapeHtml(f.value)}" tabindex="0" role="button" aria-label="Подставить ${escapeHtml(f.value)}">${f.count > 1 ? `<span class="rt-count">${f.count}</span>` : ''}${escapeHtml(f.value)}<span class="rt-del" data-del-value="${escapeHtml(f.value)}" role="button" tabindex="0" aria-label="Убрать ${escapeHtml(f.value)} из подсказок" title="Убрать из подсказок">✕</span></span>`).join('');
  wrap.querySelectorAll('.time-chip').forEach(chip => {
    const apply = () => { input.value = chip.dataset.value; };
    chip.addEventListener('click', apply);
    chip.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); apply(); } });
  });
  // крестик "убрать из подсказок" — скрывает конкретное значение навсегда (сохраняется
  // между сессиями), сама история дней не меняется; если то же значение снова
  // сохранят в карточке дня, оно автоматически вернётся (см. save-day-handler.js)
  wrap.querySelectorAll('.rt-del').forEach(del => {
    const remove = (e) => {
      e.stopPropagation();
      hiddenSet.add(del.dataset.delValue);
      persist();
      rerender();
    };
    del.addEventListener('click', remove);
    del.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); remove(e); } });
  });
}

function renderRecentBuses(){
  renderRecentFieldChips('recentBuses', getFrequentBuses(), busInput, 'недавние автобусы', hiddenBuses, renderRecentBuses);
}

function renderRecentRoutes(){
  renderRecentFieldChips('recentRoutes', getFrequentRoutes(), routeInput, 'недавние маршруты', hiddenRoutes, renderRecentRoutes);
}
