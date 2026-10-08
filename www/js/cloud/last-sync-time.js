/* cloud/last-sync-time.js
 * Память о синхронизации: когда последний раз успешно синхронизировались с
 * Google Диском и есть ли локальные изменения, которые в облако ещё не уехали.
 * Всё хранится в localStorage, поэтому переживает перезапуск приложения.
 */
const CLOUD_LAST_SYNC_KEY = 'cloudLastSyncAt_v1';
// метка updatedAt данных на момент последней успешной отправки в облако —
// сравнивая её с APP.updatedAt, понимаем, менялось ли что-то после синхронизации
const CLOUD_LAST_SYNC_DATA_KEY = 'cloudLastSyncedDataAt_v1';

function recordLastSyncTime(){
  try{
    localStorage.setItem(CLOUD_LAST_SYNC_KEY, String(Date.now()));
    localStorage.setItem(CLOUD_LAST_SYNC_DATA_KEY, String(APP.updatedAt || 0));
  }catch(err){}
}

function getLastSyncTimestamp(){
  try{
    const raw = localStorage.getItem(CLOUD_LAST_SYNC_KEY);
    if(!raw) return null;
    const n = parseInt(raw, 10);
    return isNaN(n) ? null : n;
  }catch(err){ return null; }
}

// человекочитаемое время последней синхронизации: "сегодня 14:05",
// "вчера 21:30" или "05.09 08:12" — так понятнее, чем голая дата
function formatLastSyncTime(){
  const ts = getLastSyncTimestamp();
  if(ts === null) return null;
  const d = new Date(ts);
  if(isNaN(d.getTime())) return null;

  const time = d.toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'});
  const startOfToday = new Date();
  startOfToday.setHours(0,0,0,0);
  const dayDiff = Math.floor((startOfToday.getTime() - new Date(d).setHours(0,0,0,0)) / 86400000);

  if(dayDiff === 0) return 'сегодня ' + time;
  if(dayDiff === 1) return 'вчера ' + time;
  return d.toLocaleDateString('ru-RU', {day:'2-digit', month:'2-digit'}) + ' ' + time;
}

// есть ли локальные правки, сделанные ПОСЛЕ последней успешной синхронизации
function hasUnsyncedChanges(){
  if(localStorage.getItem(CLOUD_ENABLED_KEY) !== '1') return false;
  try{
    const syncedAt = parseInt(localStorage.getItem(CLOUD_LAST_SYNC_DATA_KEY) || '0', 10) || 0;
    return (APP.updatedAt || 0) > syncedAt;
  }catch(err){ return false; }
}

// обновляет подпись рядом с кнопкой: когда синхронизировались в последний раз
// и ждут ли отправки новые изменения
function updateSyncDirtyIndicator(){
  if(typeof setCloudStatus !== 'function') return;
  if(localStorage.getItem(CLOUD_ENABLED_KEY) !== '1'){
    setCloudStatus('');
    return;
  }
  const last = formatLastSyncTime();
  if(hasUnsyncedChanges()){
    setCloudStatus('☁️ есть несинхронизированные изменения' + (last ? ' · было: ' + last : ''));
  } else if(last){
    setCloudStatusOk('☁️ синхронизировано · ' + last);
  } else {
    setCloudStatus('☁️ нажмите «Синхронизировать»');
  }
}
