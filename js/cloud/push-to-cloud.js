/* cloud/push-to-cloud.js
 * Отправка уже объединённых данных в облако.
 */
async function pushToCloud(){
  // Последняя линия защиты: данные, не проходящие проверку структуры, в облако
  // не отправляются никогда. Раньше слияние по ключам месяцев могло записать туда
  // «дни не своего месяца» — после этого ни одно устройство уже не могло
  // синхронизироваться, пока файл в облаке не будет починен.
  validateLoadedData({ months: DATA, order });

  if(!cloudFileId) cloudFileId = await driveFindFile();

  if(cloudFileId){
    // Последняя защитная проверка: если между pull и push облако изменилось
    // так, что в нём появились новые данные, не затираем их молча.
    try{
      const existingEnc = await driveDownloadFile(cloudFileId);
      const existing = await decryptFromCloud(existingEnc, cloudPassword);
      // После pull разрешённые пользователем конфликты могут намеренно
      // отличаться от текущей облачной версии. Поэтому сравниваем облако не
      // с локальными данными, а с тем снимком, который мы действительно читали
      // в начале этой синхронизации.
      if(cloudLastPulledRemoteSignature &&
         syncStateSignature(existing) !== cloudLastPulledRemoteSignature){
        throw new Error('CLOUD_CHANGED_DURING_SYNC');
      }
    }catch(err){
      if(err && err.message === 'CLOUD_CHANGED_DURING_SYNC') throw err;
      if(isDecryptError(err)) throw err;
      // Сеть/чтение может временно упасть. Не затираем облако в этом случае.
      throw new Error('Не удалось повторно проверить облачные данные перед записью: ' + (err?.message || 'неизвестная ошибка'));
    }
  }

  const payload = {
    schemaVersion: DATA_SCHEMA_VERSION,
    rate, currentKey, order, months: DATA,
    hiddenShiftTimes: Array.from(hiddenShiftTimes),
    hiddenBuses: Array.from(hiddenBuses),
    hiddenRoutes: Array.from(hiddenRoutes),
    updatedAt: APP.updatedAt || Date.now()
  };
  const encrypted = await encryptForCloud(payload, cloudPassword);
  if(!cloudFileId) cloudFileId = await driveCreateFile(encrypted);
  else await driveUpdateFile(cloudFileId, encrypted);
}
