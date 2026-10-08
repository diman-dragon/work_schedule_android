/* day-modal/add-month-confirm-handler.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
$('addMonthConfirmBtn').addEventListener('click', () => {
  const val = addMonthInput.value; // "YYYY-MM"
  if(!val){ addMonthOverlay.classList.remove('show'); return; }
  const [yStr, mStr] = val.split('-');
  const year = parseInt(yStr,10), monthIdx = parseInt(mStr,10);
  // уже есть такой месяц/год?
  const exists = order.some(k => DATA[k].year === year && DATA[k].month === monthIdx);
  if(exists){ showToast('Такой месяц уже есть в графике'); addMonthOverlay.classList.remove('show'); return; }
  const label = monthNamesNom[monthIdx-1];
  const key = makeMonthKey(year, monthIdx, label);
  DATA[key] = buildEmptyMonth(year, monthIdx);
  order.push(key);
  sortOrderChronologically();
  recomputeMonth(key);
  addMonthOverlay.classList.remove('show');
  render(key);
  persist();
  showToast(`Добавлен месяц: ${label} ${year}`);
});
