/* utils/minutes-to-hm.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
// Всегда возвращает однозначный формат "N часов M минут" — никаких "82:11", которые легко принять за время
function minutesToHM(mins){
  if(mins === null || mins === undefined || isNaN(mins)) return "—";
  const totalMin = Math.round(mins);
  const h = Math.floor(totalMin/60);
  const m = totalMin % 60;
  const hWord = pluralRu(h, ['час','часа','часов']);
  const mWord = pluralRu(m, ['минута','минуты','минут']);
  if(h === 0) return `${m} ${mWord}`;
  if(m === 0) return `${h} ${hWord}`;
  return `${h} ${hWord} ${m} ${mWord}`;
}
