/* data/ensure-current-month-exists.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
// гарантирует, что месяц с сегодняшней датой есть в графике; создаёт пустой, если нет
function ensureCurrentMonthExists(){
  const {y, m} = getTodayYM();
  let key = order.find(k => DATA[k].year === y && DATA[k].month === m);
  if(!key){
    const label = monthNamesNom[m-1];
    key = makeMonthKey(y, m, label);
    DATA[key] = buildEmptyMonth(y, m);
    order.push(key);
    sortOrderChronologically();
    recomputeMonth(key);
  }
  return key;
}
