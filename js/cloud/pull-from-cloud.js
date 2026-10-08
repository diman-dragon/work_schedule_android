/* cloud/pull-from-cloud.js
 * Синхронизация с ручным разрешением конфликтов.
 */

function cloneJson(value){
  return JSON.parse(JSON.stringify(value));
}

function dayIdentity(day){
  return day && day.date ? day.date : null;
}

function normalizeDayForSync(day){
  if(!day) return null;
  return {
    date: day.date || null,
    edited: !!day.edited,
    start: day.start || null,
    end: day.end || null,
    bus: day.bus || null,
    route: day.route || null,
    photo: day.photo || null
  };
}

function daySyncEqual(a, b){
  return JSON.stringify(normalizeDayForSync(a)) === JSON.stringify(normalizeDayForSync(b));
}

function dayHasUserData(day){
  if(!day) return false;
  return !!(day.edited || day.start || day.end || day.bus || day.route || day.photo);
}

function collectDaysByDate(monthsObj){
  const map = new Map();
  if(!monthsObj || typeof monthsObj !== 'object') return map;
  for(const key of Object.keys(monthsObj)){
    const m = monthsObj[key];
    if(!m || !Array.isArray(m.days)) continue;
    for(const d of m.days){
      const id = dayIdentity(d);
      if(id) map.set(id, { monthKey: key, day: d });
    }
  }
  return map;
}

// Слияние ведётся по ДАТЕ дня и по ГОДУ/МЕСЯЦУ контейнера, а не по ключу месяца.
// Ключи («Сентябрь», «Сентябрь '26») выдаются на каждом устройстве независимо, и
// один и тот же ключ на двух устройствах может означать разные месяцы разных
// лет. Раньше дни из облачного «Сентябрь» (2025) складывались в локальный
// «Сентябрь» (2026), после чего данные переставали проходить проверку
// (см. data/repair-months-structure.js — там же описана вся история).
function mergeMonthDays(localMonth, remoteMonth, decisions){
  const indexByDate = new Map();
  localMonth.days.forEach((d, i) => {
    const id = dayIdentity(d);
    if(id && !indexByDate.has(id)) indexByDate.set(id, i);
  });
  let added = false;

  for(const remoteDay of remoteMonth.days){
    const date = dayIdentity(remoteDay);
    if(!date) continue;
    const idx = indexByDate.get(date);
    if(idx === undefined){
      localMonth.days.push(cloneJson(remoteDay));
      added = true;
      continue;
    }

    const localDay = localMonth.days[idx];
    if(daySyncEqual(localDay, remoteDay)) continue;
    const localHas = dayHasUserData(localDay), remoteHas = dayHasUserData(remoteDay);
    if(!localHas && remoteHas){ localMonth.days[idx] = cloneJson(remoteDay); continue; }
    if(localHas && !remoteHas) continue;

    // реальный конфликт — решение пользователя (по умолчанию остаётся локальная версия)
    if((decisions[date] || 'local') === 'remote') localMonth.days[idx] = cloneJson(remoteDay);
  }

  // новые дни дописывались в конец — возвращаем календарный порядок
  if(added) localMonth.days.sort((a, b) => (parseInt(a.date, 10) || 0) - (parseInt(b.date, 10) || 0));
}

function buildMergedMonths(localMonths, remoteMonths, decisions){
  const result = cloneJson(localMonths || {});

  const idToKey = new Map();
  for(const key of Object.keys(result)){
    const m = result[key];
    if(!isSaneMonthContainer(m)) continue;
    const id = m.year * 12 + m.month;
    if(!idToKey.has(id)) idToKey.set(id, key);
  }

  for(const remoteKey of Object.keys(remoteMonths || {})){
    const remoteMonth = remoteMonths[remoteKey];
    if(!isSaneMonthContainer(remoteMonth)) continue;
    const id = remoteMonth.year * 12 + remoteMonth.month;
    const localKey = idToKey.get(id);

    if(!localKey){
      // такого месяца локально нет — берём его целиком. Облачный ключ
      // сохраняем, если он свободен; если такой ключ здесь уже занят другим
      // месяцем (см. комментарий выше) — подбираем свободный.
      const label = remoteMonth.label || monthNamesNom[remoteMonth.month - 1];
      const key = result[remoteKey]
        ? repairUniqueMonthKey(new Set(Object.keys(result)), label, remoteMonth.year)
        : remoteKey;
      result[key] = cloneJson(remoteMonth);
      idToKey.set(id, key);
      continue;
    }

    mergeMonthDays(result[localKey], remoteMonth, decisions);
  }

  return result;
}


function syncStateSignature(state){
  return JSON.stringify({
    rate: state.rate,
    months: state.months || {},
    hiddenShiftTimes: Array.from(state.hiddenShiftTimes || []).sort(),
    hiddenBuses: Array.from(state.hiddenBuses || []).sort(),
    hiddenRoutes: Array.from(state.hiddenRoutes || []).sort()
  });
}

function applyRemoteData(remote){
  rate = (typeof remote.rate === 'number' && remote.rate >= 0) ? remote.rate : rate;
  DATA = cloneJson(remote.months || {});
  // порядок берём из самих месяцев, а не из remote.order: в облачном order могут
  // отсутствовать ключи (месяц тогда не показывался бы) или повторяться
  order = Object.keys(DATA);
  sortOrderChronologically();
  hiddenShiftTimes = new Set(Array.isArray(remote.hiddenShiftTimes) ? remote.hiddenShiftTimes : []);
  hiddenBuses = new Set(Array.isArray(remote.hiddenBuses) ? remote.hiddenBuses : []);
  hiddenRoutes = new Set(Array.isArray(remote.hiddenRoutes) ? remote.hiddenRoutes : []);
  // как и при обычном запуске — открываемся на сегодняшнем месяце (создаём его, если
  // в облаке его ещё нет); раньше открывался тот месяц, что был открыт на другом устройстве
  currentKey = ensureCurrentMonthExists();
  $('rateInput').value = rate;
  renderMonthsStrip();
  recomputeAll();
  render(currentKey);
}

async function downloadRemoteSnapshot(){
  cloudFileId = await driveFindFile();
  if(!cloudFileId) return null;
  const encrypted = await driveDownloadFile(cloudFileId);
  const remote = await decryptFromCloud(encrypted, cloudPassword);
  // Подпись берём с СЫРОГО снимка, до любых исправлений: pushToCloud сравнивает её
  // с заново скачанным облаком, то есть тоже с сырым.
  cloudLastPulledRemoteSignature = syncStateSignature(remote);

  // Если в облаке уже лежат данные с перепутанными месяцами (их записало старое
  // слияние), чиним их здесь, а не отказываемся синхронизироваться навсегда.
  // Исправленная версия уйдёт в облако при завершении этой же синхронизации.
  const fixed = repairLoadedData({ months: remote.months, order: remote.order || [] });
  if(fixed.repaired){
    console.warn('Структура данных в облаке исправлена, затронуто записей:', fixed.repaired);
    remote.months = fixed.months;
    remote.order = fixed.order;
    showToast('☁️ В облаке исправлен порядок месяцев — данные не потеряны');
  }
  validateLoadedData({ months: remote.months, order: remote.order || [] });
  return remote;
}

async function pullFromCloud(){
  const remote = await downloadRemoteSnapshot();
  if(!remote) return { changed: false, remoteMissing: true };

  const localDays = collectDaysByDate(DATA);
  const remoteDays = collectDaysByDate(remote.months);
  const conflicts = [];

  for(const [date, remoteEntry] of remoteDays){
    const localEntry = localDays.get(date);
    if(localEntry && !daySyncEqual(localEntry.day, remoteEntry.day) &&
       dayHasUserData(localEntry.day) && dayHasUserData(remoteEntry.day)){
      conflicts.push({ date, local: localEntry.day, remote: remoteEntry.day });
    }
  }

  // Если на локальном устройстве данных не было вообще, облачная версия
  // принимается без каких-либо попыток сравнить её с только что созданным
  // пустым месяцем.
  if(!HAS_LOCAL_DATA){
    // бэкап пустого состояния бессмыслен и вытеснил бы настоящие бэкапы из списка
    if(countFilledDays(DATA) > 0) createLocalBackup('перед первой загрузкой из облака');
    applyRemoteData(remote);
    APP.updatedAt = remote.updatedAt || Date.now();
    persistLocalOnly();
    APP.updatedAt = remote.updatedAt || Date.now();
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(APP)); }catch(err){}
    HAS_LOCAL_DATA = true;
    return { changed: true, remoteMissing: false };
  }

  let decisions = {};
  if(conflicts.length){
    const result = await showSyncConflicts(conflicts);
    if(!result){
      setCloudStatus('☁️ синхронизация отменена: конфликты не разрешены', true);
      return { changed: false, cancelled: true };
    }
    conflicts.forEach((c, i) => { decisions[c.date] = result[i] || 'local'; });
  }

  // локальные данные тоже приводим к согласованному виду перед слиянием
  const localFixed = repairLoadedData({ months: DATA, order });
  const localMonths = localFixed.repaired ? localFixed.months : DATA;
  const mergedMonths = buildMergedMonths(localMonths, remote.months, decisions);

  // Состояние «до» фиксируем сейчас — дальше ставка/данные будут заменены.
  const signatureBefore = syncStateSignature({ rate, months: DATA, hiddenShiftTimes, hiddenBuses, hiddenRoutes });

  // Глобальная ставка тоже может быть изменена на двух устройствах.
  // Если она различается и обе стороны имеют локальные данные, спрашиваем отдельно.
  let mergedRate = rate;
  if(typeof remote.rate === 'number' && remote.rate !== rate){
    const useRemoteRate = await showConfirmModal(
      `Ставка на этом устройстве: ${rate}. В облаке: ${remote.rate}. Выберите, какую ставку сохранить.`,
      'Конфликт ставки',
      'Взять из облака'
    );
    if(useRemoteRate) mergedRate = remote.rate;
  }

  const mergedHiddenShiftTimes = new Set([...hiddenShiftTimes, ...(Array.isArray(remote.hiddenShiftTimes) ? remote.hiddenShiftTimes : [])]);
  const mergedHiddenBuses = new Set([...hiddenBuses, ...(Array.isArray(remote.hiddenBuses) ? remote.hiddenBuses : [])]);
  const mergedHiddenRoutes = new Set([...hiddenRoutes, ...(Array.isArray(remote.hiddenRoutes) ? remote.hiddenRoutes : [])]);

  const signatureAfter = syncStateSignature({
    rate: mergedRate,
    months: mergedMonths,
    hiddenShiftTimes: mergedHiddenShiftTimes,
    hiddenBuses: mergedHiddenBuses,
    hiddenRoutes: mergedHiddenRoutes
  });
  const changed = signatureBefore !== signatureAfter || localFixed.repaired > 0;

  // Бэкап — ДО подмены данных. Раньше он делался уже после присвоения
  // DATA = mergedMonths и сохранял не состояние «до», а результат слияния.
  if(changed) createLocalBackup('перед объединением локальных и облачных данных');

  rate = mergedRate;
  DATA = mergedMonths;
  order = Object.keys(DATA);
  hiddenShiftTimes = mergedHiddenShiftTimes;
  hiddenBuses = mergedHiddenBuses;
  hiddenRoutes = mergedHiddenRoutes;
  if(!DATA[currentKey]) currentKey = ensureCurrentMonthExists();

  sortOrderChronologically();
  recomputeAll();
  $('rateInput').value = rate; // раньше при выборе облачной ставки поле ввода оставалось со старым числом
  renderMonthsStrip();
  render(currentKey);

  if(changed){
    APP.updatedAt = Math.max(Number(APP.updatedAt || 0), Number(remote.updatedAt || 0), Date.now());
    persistLocalOnly();
  }

  return { changed, remoteMissing: false };
}

async function forcePullFromCloud(){
  const remote = await downloadRemoteSnapshot();
  if(!remote) throw new Error('В облаке нет файла с данными');

  createLocalBackup('перед принудительной загрузкой из облака');
  applyRemoteData(remote);
  APP.updatedAt = remote.updatedAt || Date.now();
  persistLocalOnly();
  APP.updatedAt = remote.updatedAt || Date.now();
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(APP)); }catch(err){}
  HAS_LOCAL_DATA = true;
  return countFilledDays(DATA);
}
