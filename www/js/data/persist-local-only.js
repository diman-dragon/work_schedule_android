/* data/persist-local-only.js
 * Сохраняет текущее состояние (график, ставку, тему) в localStorage.
 */

// Слепок последнего сохранённого содержимого. Нужен, чтобы отличать реальное
// изменение данных от простой перерисовки/перезапуска приложения.
let lastPersistedSignature = null;

// В подпись входят только сами данные — тема оформления и выбранный месяц
// на "свежесть" данных не влияют и метку времени двигать не должны.
function buildDataSignature(){
  return JSON.stringify({
    rate,
    order,
    months: DATA,
    hiddenShiftTimes: Array.from(hiddenShiftTimes),
    hiddenBuses: Array.from(hiddenBuses),
    hiddenRoutes: Array.from(hiddenRoutes)
  });
}

function persistLocalOnly(){
  try{
    const signature = buildDataSignature();

    // КРИТИЧНО: метку времени двигаем ТОЛЬКО если данные действительно
    // изменились. Раньше updatedAt обновлялась при каждом вызове persist(),
    // в том числе при обычном запуске приложения (bootstrap вызывает persist).
    // На устройстве с пустым хранилищем это приводило к катастрофе:
    // пустые данные получали метку "сейчас", выглядели свежее облачных,
    // pullFromCloud отказывался их подтягивать, а следующий pushToCloud
    // затирал облако пустотой. Теперь пустой запуск метку не трогает.
    if(lastPersistedSignature === null){
      // первое сохранение в этой сессии: если содержимое совпадает с тем,
      // что уже лежит в localStorage, значит ничего не менялось — сохраняем
      // прежнюю метку времени
      const changed = signature !== (APP.__signature || null);
      if(!changed && APP.updatedAt){
        lastPersistedSignature = signature;
      }
    }

    const dataChanged = signature !== lastPersistedSignature;
    const updatedAt = dataChanged ? Date.now() : (APP.updatedAt || Date.now());

    APP = {
      schemaVersion: DATA_SCHEMA_VERSION,
      rate, currentKey, order, months: DATA,
      theme: document.documentElement.getAttribute('data-theme') || 'dark',
      hiddenShiftTimes: Array.from(hiddenShiftTimes),
      hiddenBuses: Array.from(hiddenBuses),
      hiddenRoutes: Array.from(hiddenRoutes),
      updatedAt,
      __signature: signature
    };
    lastPersistedSignature = signature;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(APP));
    HAS_LOCAL_DATA = true;
    // Раньше подпись "есть несинхронизированные изменения" обновлялась только
    // в нескольких местах вручную (после сохранения дня, после синхронизации),
    // и часть изменений — смена ставки, импорт, очистка, добавление месяца,
    // смена темы, скрытие подсказки — этот статус не трогали вообще. Теперь
    // это встроено прямо в persistLocalOnly(), которую в итоге вызывают все
    // операции, меняющие данные — статус не может отстать от реальности.
    // updateSyncDirtyIndicator определяется одним из последних скриптов —
    // на самом первом старте (bootstrap вызывает persist сразу) она ещё
    // может быть не загружена, поэтому проверяем перед вызовом.
    if(typeof updateSyncDirtyIndicator === 'function') updateSyncDirtyIndicator();
  }catch(err){
    console.error('Не удалось сохранить данные в localStorage', err);
    if(typeof showToast === 'function'){
      showToast('⚠️ Не удалось сохранить: не хватает места в памяти браузера. Удалите старые фото или сделайте резервную копию');
    }
  }
}

// Сколько заполненных (отредактированных) дней есть в наборе данных.
// Используется защитой от затирания: пустой набор никогда не должен
// молча перезаписать непустой.
function countFilledDays(monthsObj){
  let n = 0;
  if(!monthsObj || typeof monthsObj !== 'object') return 0;
  for(const key of Object.keys(monthsObj)){
    const m = monthsObj[key];
    if(!m || !Array.isArray(m.days)) continue;
    for(const d of m.days){
      if(d && (d.edited || d.start || d.photo)) n++;
    }
  }
  return n;
}
