/* cloud/set-cloud-status.js
 * Единая точка изменения статуса синхронизации: текст + подсветка состояния
 * (успех/ошибка/нейтральный, см. css/14-quick-actions-and-sync-status.css).
 * Раньше подсветка ошибки задавалась инлайн-стилем прямо здесь, а "успешное"
 * состояние определял отдельный MutationObserver в другом файле по регэкспу
 * над текстом — два параллельных механизма для одной и той же задачи. Теперь
 * состояние всегда явное: либо ошибка (isError), либо успех (setCloudStatusOk),
 * либо нейтральное сообщение (просто setCloudStatus без подсветки).
 */
function setCloudStatus(text, isError){
  cloudSyncStatus.textContent = text || '';
  cloudSyncStatus.classList.toggle('error', !!isError);
  cloudSyncStatus.classList.remove('ok');
}
function setCloudStatusOk(text){
  cloudSyncStatus.textContent = text || '';
  cloudSyncStatus.classList.remove('error');
  cloudSyncStatus.classList.add('ok');
}
