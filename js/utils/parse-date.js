/* utils/parse-date.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
function parseDate(d){
  const [dd, mm, yyyy] = d.split('.').map(Number);
  return new Date(yyyy, mm-1, dd);
}
