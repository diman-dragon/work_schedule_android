/* data/repair-months-structure.js
 * Приводит набор месяцев к согласованному виду ПЕРЕД проверкой validateLoadedData().
 *
 * ЗАЧЕМ. Ключ месяца в DATA — это просто название («Сентябрь», «Сентябрь '26»),
 * и он выдаётся на каждом устройстве независимо: первое вхождение месяца
 * получает голое название, следующие — название с годом. Поэтому «Сентябрь» на
 * одном устройстве может оказаться сентябрём 2026, а на другом — сентябрём 2025.
 * Раньше слияние с облаком сопоставляло месяцы ПО КЛЮЧУ и складывало дни
 * сентября 2025 в контейнер «Сентябрь» (2026). Такие данные уезжали в облако и
 * в localStorage, а строгая проверка потом отвергала их с ошибкой
 * «дата дня не соответствует месяцу "Сентябрь"» — синхронизация ломалась
 * навсегда, а при следующем запуске локальные данные считались повреждёнными.
 *
 * ЧТО ДЕЛАЕМ. Источник истины — дата самого дня (ДД.ММ.ГГГГ), а не ключ:
 *   • день, лежащий не в «своём» месяце, переносится в месяц своей даты
 *     (если такого месяца нет — создаётся, ключ подбирается свободный);
 *   • два контейнера с одним и тем же годом/месяцем сливаются в один;
 *   • дубли одной даты схлопываются (остаётся день с пользовательскими данными);
 *   • в затронутых месяцах дни сортируются, а недостающие даты дополняются
 *     пустыми днями — чтобы календарная сетка не «дырявилась».
 * Ничего не удаляется, кроме точных дублей даты.
 *
 * Функция НЕ меняет переданный объект: возвращает { months, order, repaired }.
 * Если чинить нечего (repaired === 0) — возвращает исходные months/order как есть.
 *
 * Файл должен подключаться ПОСЛЕ config/month-weekday-names.js и
 * data/build-empty-month.js (использует их) и ДО init/00-load-app-state.js.
 */
const REPAIR_DATE_RE = /^(\d{2})\.(\d{2})\.(\d{4})$/;

function isSaneMonthContainer(m){
  return !!m && typeof m === 'object' && Array.isArray(m.days) &&
    Number.isInteger(m.year) && Number.isInteger(m.month) &&
    m.month >= 1 && m.month <= 12 && m.year >= 2000 && m.year <= 2100;
}

function parseDayDateParts(d){
  if(!d || typeof d !== 'object' || typeof d.date !== 'string') return null;
  const match = d.date.match(REPAIR_DATE_RE);
  if(!match) return null;
  const day = Number(match[1]), month = Number(match[2]), year = Number(match[3]);
  if(month < 1 || month > 12 || year < 2000 || year > 2100) return null;
  if(day < 1 || day > new Date(year, month, 0).getDate()) return null;
  return { day, month, year };
}

function repairDayHasUserData(d){
  return !!(d && (d.edited || d.start || d.end || d.bus || d.route || d.photo));
}

// из двух записей одной даты оставляем ту, где есть данные пользователя;
// если данные есть у обеих — ту, что лежала в «своём» месяце
function pickBetterDayEntry(a, b){
  const ua = repairDayHasUserData(a.day), ub = repairDayHasUserData(b.day);
  if(ua !== ub) return ua ? a : b;
  if(a.home !== b.home) return a.home ? a : b;
  return a;
}

function repairUniqueMonthKey(usedKeys, label, year){
  if(!usedKeys.has(label)) return label;
  const withYear = `${label} '${String(year).slice(2)}`;
  let key = withYear, n = 2;
  while(usedKeys.has(key)){ key = withYear + ' (' + n + ')'; n++; }
  return key;
}

function repairLoadedData(obj){
  const untouched = { months: obj ? obj.months : undefined, order: obj ? obj.order : undefined, repaired: 0 };
  if(!obj || !obj.months || typeof obj.months !== 'object' || Array.isArray(obj.months)) return untouched;

  const src = obj.months;
  const keys = Object.keys(src);
  const usedKeys = new Set(keys);

  // 1) какой ключ «владеет» каждым годом/месяцем (первый по порядку ключей)
  const idToKey = new Map();
  for(const key of keys){
    const m = src[key];
    if(!isSaneMonthContainer(m)) continue;
    const id = m.year * 12 + m.month;
    if(!idToKey.has(id)) idToKey.set(id, key);
  }

  const created = new Map();   // ключ нового месяца → его «скелет»
  const buckets = new Map();   // ключ месяца → Map(дата → { day, home })
  const undated = new Map();   // ключ месяца → дни без разборчивой даты (оставляем на месте)
  let repaired = 0;

  const bucketOf = (key) => { if(!buckets.has(key)) buckets.set(key, new Map()); return buckets.get(key); };

  // 2) раскладываем каждый день по месяцу его собственной даты
  for(const key of keys){
    const m = src[key];
    if(!isSaneMonthContainer(m)) continue;
    const homeKey = idToKey.get(m.year * 12 + m.month);
    if(homeKey !== key) repaired++; // второй контейнер того же месяца — будет слит в первый
    for(const d of m.days){
      const parts = parseDayDateParts(d);
      if(!parts){
        if(!undated.has(homeKey)) undated.set(homeKey, []);
        undated.get(homeKey).push(d);
        continue;
      }
      const id = parts.year * 12 + parts.month;
      let destKey = idToKey.get(id);
      if(!destKey){
        const label = monthNamesNom[parts.month - 1];
        destKey = repairUniqueMonthKey(usedKeys, label, parts.year);
        usedKeys.add(destKey);
        idToKey.set(id, destKey);
        created.set(destKey, { year: parts.year, month: parts.month, label, days: [], total_minutes: 0, total_sum: 0 });
      }
      if(destKey !== key) repaired++; // день лежал не в своём месяце
      const entry = { day: d, home: destKey === key };
      const bucket = bucketOf(destKey);
      const prev = bucket.get(d.date);
      if(prev){ repaired++; bucket.set(d.date, pickBetterDayEntry(prev, entry)); }
      else bucket.set(d.date, entry);
    }
  }

  if(!repaired) return untouched;

  // 3) собираем месяцы заново: дни по порядку, недостающие даты — пустыми
  const rebuild = (key, container) => {
    const bucket = buckets.get(key) || new Map();
    const template = buildEmptyMonth(container.year, container.month).days;
    const days = template.map(t => (bucket.has(t.date) ? bucket.get(t.date).day : t));
    const extra = undated.get(key);
    if(extra) days.push(...extra);
    return Object.assign({}, container, { days });
  };

  const months = {};
  for(const key of keys){
    const m = src[key];
    if(!isSaneMonthContainer(m)){ months[key] = m; continue; }
    if(idToKey.get(m.year * 12 + m.month) !== key) continue; // слит в первый контейнер
    months[key] = rebuild(key, m);
  }
  for(const [key, skeleton] of created) months[key] = rebuild(key, skeleton);

  // порядок — хронологический; «нераспознанные» месяцы (если есть) — в конец
  const order = Object.keys(months).sort((a, b) => {
    const ma = months[a], mb = months[b];
    const sa = isSaneMonthContainer(ma), sb = isSaneMonthContainer(mb);
    if(sa !== sb) return sa ? -1 : 1;
    if(!sa) return 0;
    return (ma.year - mb.year) || (ma.month - mb.month);
  });

  return { months, order, repaired };
}
