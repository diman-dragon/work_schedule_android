/* cloud/day-fingerprints.js
 * Строит "отпечатки" рабочих дней для сравнения двух наборов данных по
 * СОДЕРЖИМОМУ, а не только по количеству.
 *
 * Раньше конфликт между двумя устройствами определялся сравнением
 * количества смен: если на телефоне и на компьютере было ОДИНАКОВОЕ число
 * смен (например, по одной, но на РАЗНЫЕ дни), приложение не видело в этом
 * конфликта и просто заменяло одну версию другой — реальные данные с
 * одного из устройств терялись молча.
 *
 * Отпечаток дня строится из "первичных" полей (дата, время, автобус,
 * маршрут) — вычисляемые (minutes/hours/sum/pending) сознательно не
 * учитываются, так как всегда пересчитываются заново и не несут
 * дополнительной информации о содержимом.
 */
function buildDayFingerprints(monthsObj){
  const set = new Set();
  if(!monthsObj || typeof monthsObj !== 'object') return set;
  for(const key of Object.keys(monthsObj)){
    const m = monthsObj[key];
    if(!m || !Array.isArray(m.days)) continue;
    for(const d of m.days){
      if(!d || !d.start) continue;
      set.add([d.date, d.start, d.end, d.bus || '', d.route || ''].join('|'));
    }
  }
  return set;
}

// Возвращает { onlyInA, onlyInB } — множества отпечатков, которые есть
// только с одной из сторон. Оба пустых => содержимое идентично.
function diffDayFingerprints(monthsA, monthsB){
  const a = buildDayFingerprints(monthsA);
  const b = buildDayFingerprints(monthsB);
  const onlyInA = new Set([...a].filter(x => !b.has(x)));
  const onlyInB = new Set([...b].filter(x => !a.has(x)));
  return { onlyInA, onlyInB };
}
