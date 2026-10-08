/* utils/get-today-ym.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
// ---------- ФОКУС НА ТЕКУЩЕМ МЕСЯЦЕ/ДНЕ ----------
function getTodayYM(){
  const now = new Date();
  return { y: now.getFullYear(), m: now.getMonth()+1 };
}
