/* shift/pending-shift-watcher.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
// раз в минуту проверяем — не закончилась ли ещё идущая смена; если да, пересчитываем
// итоги, чтобы доход появился в статистике сам, без перезагрузки страницы.
// Проверяем ВСЕ месяцы, а не только открытый сейчас — иначе смена, оставленная
// "висящей" в другом (например, предыдущем) месяце, не пересчиталась бы, пока
// пользователь сам туда не переключится.
setInterval(() => {
  let anyChanged = false;
  for(const key of Object.keys(DATA)){
    const m = DATA[key];
    if(!m || !Array.isArray(m.days)) continue;
    const hadPending = m.days.some(d => d.pending);
    if(hadPending){
      recomputeMonth(key);
      anyChanged = true;
    }
  }
  if(anyChanged){
    render(currentKey);
    persist();
  }
}, 60000);
