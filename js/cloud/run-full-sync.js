/* cloud/run-full-sync.js
 * Полная синхронизация — ТОЛЬКО по нажатию кнопки «Синхронизировать».
 * Автоматической фоновой синхронизации в приложении нет: ни при запуске,
 * ни при сохранении дня. Так поведение предсказуемо (данные уезжают в облако
 * тогда, когда вы этого захотели) и, главное, запрос токена Google всегда
 * происходит внутри клика — иначе мобильный браузер блокирует окно входа.
 */
async function runFullSync(){
  if(!isCloudSyncActive() || cloudBusy) return;
  cloudBusy = true;
  try{
    // токен запрашиваем здесь, внутри пользовательского клика: если он
    // протух (а на телефоне он протухает почти всегда), Google покажет
    // короткое окно входа — это нормально и занимает пару секунд
    setCloudStatus('☁️ вход в Google…');
    await requestCloudToken(true);

    setCloudStatus('☁️ синхронизация…');
    const pullResult = await pullFromCloud();
    if(pullResult && pullResult.cancelled) return;
    if(pullResult && pullResult.remoteMissing){
      // Облака ещё нет: текущая локальная копия становится первой облачной.
      HAS_LOCAL_DATA = true;
    }
    await pushToCloud();
    recordLastSyncTime();
    setCloudStatusOk('☁️ синхронизировано · ' + (formatLastSyncTime() || ''));
  }catch(err){
    console.error('Ошибка синхронизации с Google Диском', err);
    setCloudStatus('☁️ ' + describeCloudError(err), true);
  } finally {
    cloudBusy = false;
  }
}
