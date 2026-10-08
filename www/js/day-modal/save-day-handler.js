/* day-modal/save-day-handler.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
$('saveBtn').addEventListener('click', (ev) => {
  if(!editingDay) return;
  const {key, idx} = editingDay;
  const d = DATA[key].days[idx];
  const isWorking = workSwitch.classList.contains('on');
  // <input type="time"> можно очистить — пустая строка в start/end потом не проходит
  // проверку данных, и при следующем запуске весь график считался бы повреждённым
  if(isWorking && (!startInput.value || !endInput.value)){
    showToast('Укажите время начала и конца смены');
    return;
  }
  if(isWorking && startInput.value === endInput.value){
    showToast('Начало и конец смены совпадают — исправьте время');
    return;
  }
  d.edited = true;
  if(isWorking){
    d.start = startInput.value;
    d.end = endInput.value;
    // довоз до гаража после последней остановки — фиксированные
    // GARAGE_RETURN_MIN минут, применяются автоматически ко всем сменам
    // (см. shift/recompute-day.js), поэтому здесь ничего не сохраняем
    d.bus = busInput.value.trim() || null;
    d.route = routeInput.value.trim() || null;
    // если это же время/автобус/маршрут когда-то скрыли крестиком из подсказок,
    // а теперь его снова вводят вручную — значит, скрытие было случайным
    // (или это регулярная смена), и подсказку нужно вернуть, а не хоронить навсегда
    hiddenShiftTimes.delete(d.start + '–' + d.end);
    if(d.bus) hiddenBuses.delete(d.bus);
    if(d.route) hiddenRoutes.delete(d.route);
  } else {
    d.start = null;
    d.end = null;
    d.bus = null;
    d.route = null;
  }
  recomputeMonth(key);
  closeModal();
  render(key);
  persist();
  // Синхронизация с облаком здесь НЕ запускается. Google трогается только
  // из runFullSync() — то есть только по явному нажатию кнопки
  // «Синхронизировать» (см. cloud/run-full-sync.js и README: «сеть — только
  // по нажатию кнопки»). Сохранение дня — чисто локальная операция.
});
