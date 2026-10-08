/* init/register-service-worker.js
 * Регистрирует sw.js (см. описание там) — без этого шага сам файл
 * service worker'а просто лежал бы в проекте, но браузер его не подхватит.
 * Регистрация не блокирует загрузку страницы и не требует интернета сама
 * по себе (если sw.js уже закеширован с прошлого посещения — событие
 * 'install' просто не наступит повторно).
 */
if('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((err) => {
      console.error('Не удалось зарегистрировать service worker', err);
    });
  });
}
