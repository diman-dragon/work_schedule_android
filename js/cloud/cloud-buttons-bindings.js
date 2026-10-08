/* cloud/cloud-buttons-bindings.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
const cloudDisconnectBtn = $('cloudDisconnectBtn');
cloudSyncBtn.addEventListener('click', async () => {
  if(isCloudSyncActive()) runFullSync();
  else connectCloudSync();
});
cloudDisconnectBtn.addEventListener('click', async () => {
  const ok = await showConfirmModal('Отключить синхронизацию с Google Диском на этом устройстве? Данные в облаке останутся нетронутыми, локальные — тоже.', 'Отключить синхронизацию', 'Отключить');
  if(ok) disconnectCloudSync();
});
// при старте, если синхронизация уже включена на этом устройстве — один раз тихо
// подтягиваем свежие данные (без окна входа, если сессия Google ещё жива)
