/* cloud/initial-local-state.js
 * Первый запуск на устройстве без localStorage-данных.
 */
async function offerInitialCloudRestore(){
  if(HAS_LOCAL_DATA) return;

  const wantsCloud = await showConfirmModal(
    'На этом устройстве локальных данных нет. Можно скачать их из облака. ' +
    'Если облачного файла ещё нет, приложение предложит создать новый.',
    'Локальных данных нет',
    'Скачать из облака'
  );
  if(!wantsCloud){
    showToast('Начат пустой локальный график. Данные будут сохраняться на этом устройстве.');
    return;
  }

  await connectCloudSync({ initialEmptyLocal: true });
}
