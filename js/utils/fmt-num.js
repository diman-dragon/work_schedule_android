/* utils/fmt-num.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
function fmtNum(n){
  if(n === null || n === undefined || isNaN(n)) return "—";
  return Math.round(n).toLocaleString('ru-RU');
}
