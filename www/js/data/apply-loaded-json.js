/* data/apply-loaded-json.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
function applyLoadedJson(text, fileLabel){
  const obj = JSON.parse(text);
  // файл, выгруженный из испорченного состояния (дни не в своём месяце), чиним,
  // а не отвергаем: иначе такой экспорт/бэкап невозможно было бы загрузить обратно
  const fixed = repairLoadedData(obj);
  if(fixed.repaired){ obj.months = fixed.months; obj.order = fixed.order; }
  validateLoadedData(obj);
  DATA = obj.months;
  order = sanitizeOrder(obj.order, obj.months);
  hiddenShiftTimes = new Set(Array.isArray(obj.hiddenShiftTimes) ? obj.hiddenShiftTimes : []);
  hiddenBuses = new Set(Array.isArray(obj.hiddenBuses) ? obj.hiddenBuses : []);
  hiddenRoutes = new Set(Array.isArray(obj.hiddenRoutes) ? obj.hiddenRoutes : []);
  rate = (typeof obj.rate === 'number' && obj.rate >= 0) ? obj.rate : 700;
  sortOrderChronologically();
  recomputeAll();
  currentKey = ensureCurrentMonthExists(); // фокус на сегодняшнем месяце, создаём его, если отсутствует
  $('rateInput').value = rate;
  render(currentKey);
  persist();
  showToast('Данные загружены' + (fileLabel ? ' из ' + fileLabel : '') + ' и сохранены локально' + (fixed.repaired ? ' (порядок месяцев исправлен)' : ''));
}
