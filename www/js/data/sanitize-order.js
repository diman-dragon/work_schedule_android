/* data/sanitize-order.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
// убирает из order ключи месяцев, для которых нет данных в months —
// именно это раньше приводило к сбою при открытии файла с "битым" порядком
function sanitizeOrder(ord, data){
  return (Array.isArray(ord) ? ord : []).filter(k => data && data[k]);
}
