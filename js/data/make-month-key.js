/* data/make-month-key.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
function makeMonthKey(year, monthIdx1based, label){
  // ключ уникален и человекочитаем: "Название" для первого вхождения месяца,
  // иначе "Название 'ГГ" (короткий год), чтобы не путать одноимённые месяцы разных лет
  let base = label;
  if(!DATA[base]) return base;
  let withYear = `${label} '${String(year).slice(2)}`;
  let key = withYear, n = 2;
  while(DATA[key]){ key = withYear + ' (' + n + ')'; n++; }
  return key;
}
