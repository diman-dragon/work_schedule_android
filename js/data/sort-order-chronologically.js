/* data/sort-order-chronologically.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
// ---------- СОРТИРОВКА ПОРЯДКА МЕСЯЦЕВ ПО ДАТЕ ----------
function sortOrderChronologically(){
  order.sort((a,b) => {
    const ma = DATA[a], mb = DATA[b];
    return (ma.year - mb.year) || (ma.month - mb.month);
  });
}
