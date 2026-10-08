/* cloud/connect-cloud-sync.js
 * Первичное подключение синхронизации на этом устройстве.
 * Пароль сохраняется на устройстве до явного отключения синхронизации.
 */
async function connectCloudSync(options = {}){
  if(cloudBusy) return;
  cloudBusy = true;
  try{
    setCloudStatus('☁️ вход в Google…');
    await requestCloudToken(true);

    let pass = cloudPassword;
    if(!pass){
      const result = await promptSyncPassword(
        'Данные на Google Диске хранятся зашифрованными. Введите пароль (в первый раз — придумайте его, дальше используйте всегда один и тот же).'
      );
      if(!result){ setCloudStatus(''); return; }
      pass = result.password;
    }

    cloudPassword = pass;
    // По требованиям приложения пароль живёт на этом устройстве до
    // принудительного выхода через «Отключить синхронизацию».
    try{
      localStorage.setItem(CLOUD_PASS_SESSION_KEY, pass);
      localStorage.setItem(CLOUD_ENABLED_KEY, '1');
      localStorage.removeItem(CLOUD_PASS_REMEMBER_KEY); // наследие старых версий
    }catch(err){}

    setCloudStatus('☁️ синхронизация…');

    if(options.initialEmptyLocal){
      cloudFileId = await driveFindFile();
      if(cloudFileId){
        // На чистом устройстве только скачиваем облако. Пустое локальное
        // состояние никогда не отправляется поверх существующего облака.
        await pullFromCloud();
      }else{
        const create = await showConfirmModal(
          'В облаке пока нет файла с данными. Создать новый облачный файл из текущего пустого графика?',
          'В облаке нет данных',
          'Создать файл'
        );
        if(create){
          persistLocalOnly();
          await pushToCloud();
        }else{
          localStorage.removeItem(CLOUD_ENABLED_KEY);
          localStorage.removeItem(CLOUD_PASS_SESSION_KEY);
          cloudPassword = null;
          setCloudStatus('');
          return;
        }
      }
    }else{
      const pullResult = await pullFromCloud();
      // Если пользователь отменил разбор конфликтов, в облако ничего не отправляем:
      // раньше push выполнялся всё равно и молча затирал спорные дни облака локальными.
      if(pullResult && pullResult.cancelled){
        // подключение при этом уже выполнено (пароль сохранён) — кнопки показываем как у подключённого
        cloudSyncBtn.textContent = '🔄 Синхронизировать';
        cloudDisconnectBtn.style.display = '';
        return;
      }
      await pushToCloud();
    }

    recordLastSyncTime();
    setCloudStatusOk('☁️ синхронизировано · ' + (formatLastSyncTime() || ''));
    cloudSyncBtn.textContent = '🔄 Синхронизировать';
    cloudDisconnectBtn.style.display = '';
  }catch(err){
    console.error('Не удалось подключить синхронизацию', err);
    if(isDecryptError(err)){
      cloudPassword = null;
      try{ sessionStorage.removeItem(CLOUD_PASS_SESSION_KEY); }catch(e){}
      localStorage.removeItem(CLOUD_PASS_SESSION_KEY);
      localStorage.removeItem(CLOUD_ENABLED_KEY);
      localStorage.removeItem(CLOUD_PASS_REMEMBER_KEY);
    }
    setCloudStatus('☁️ ' + describeCloudError(err), true);
  } finally {
    cloudBusy = false;
  }
}
