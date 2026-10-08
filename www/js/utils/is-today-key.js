/* utils/is-today-key.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
function isTodayKey(key){
  const {y, m} = getTodayYM();
  return DATA[key] && DATA[key].year === y && DATA[key].month === m;
}
