/* utils/load-script-once.js
 * Общий помощник для отложенной подгрузки <script> — используется для
 * Chart.js, confetti и Google-скрипта авторизации, ни один из которых
 * больше не грузится сразу при открытии приложения (см. описание в
 * js/vendor/README.md и js/cloud/ensure-gis-loaded.js).
 * Возвращает Promise, который резолвится один раз даже при повторных
 * вызовах с тем же src — повторной вставки тега не будет.
 */
const loadScriptOncePromises = {};
function loadScriptOnce(src){
  if(loadScriptOncePromises[src]) return loadScriptOncePromises[src];
  loadScriptOncePromises[src] = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => { delete loadScriptOncePromises[src]; reject(new Error('Не удалось загрузить ' + src)); };
    document.head.appendChild(s);
  });
  return loadScriptOncePromises[src];
}
