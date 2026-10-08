/* cloud/restore-from-cloud.js
 * Кнопка «Загрузить из облака» — принудительно забирает облачную версию
 * и заменяет ею локальные данные. Нужна, когда на устройстве пусто
 * (переустановка, очистка данных браузера, новый телефон), а вся история
 * лежит в облаке.
 *
 * Перед заменой автоматически делается локальный бэкап текущего состояния,
 * так что действие обратимо.
 */
async function restoreFromCloud(){
  if(cloudBusy) return;

  if(localStorage.getItem(CLOUD_ENABLED_KEY) !== '1' || !cloudPassword){
    setCloudStatus('☁️ сначала подключите синхронизацию', true);
    return;
  }

  const localFilled = countFilledDays(DATA);
  const warn = localFilled > 0
    ? `На этом устройстве сейчас ${localFilled} смен(ы). Они будут заменены версией из облака. Резервная копия текущих данных сохранится автоматически.`
    : 'Данные будут загружены из облака и заменят текущее (пустое) состояние.';

  const ok = await showConfirmModal(warn, 'Загрузить данные из облака?', 'Загрузить');
  if(!ok) return;

  cloudBusy = true;
  try{
    setCloudStatus('☁️ вход в Google…');
    await requestCloudToken(true);
    setCloudStatus('☁️ загрузка из облака…');
    const filled = await forcePullFromCloud();
    recordLastSyncTime();
    setCloudStatusOk('☁️ загружено из облака · смен: ' + filled);
    showToast('Данные загружены из облака: смен — ' + filled);
  }catch(err){
    console.error('Не удалось загрузить из облака', err);
    setCloudStatus('☁️ ' + describeCloudError(err), true);
  } finally {
    cloudBusy = false;
  }
}

const cloudRestoreBtn = $('cloudRestoreBtn');
if(cloudRestoreBtn){
  cloudRestoreBtn.addEventListener('click', restoreFromCloud);
}
