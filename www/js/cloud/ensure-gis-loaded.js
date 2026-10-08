/* cloud/ensure-gis-loaded.js
 * Скрипт авторизации Google (accounts.google.com/gsi/client) — единственная
 * вещь во всём приложении, для которой интернет действительно неизбежен
 * (это живой сервис Google, локальную копию сделать нельзя). Раньше он
 * грузился сразу при открытии приложения, из-за чего приложение лезло в
 * сеть даже когда пользователь просто хотел посмотреть табель офлайн — и
 * на нестабильном мобильном интернете мог придержать выполнение всех
 * скриптов, идущих следом в HTML (в т.ч. код, что показывает время
 * последней синхронизации).
 *
 * Теперь этот скрипт вставляется в страницу ТОЛЬКО в момент, когда
 * пользователь сам нажимает кнопку синхронизации — то есть интернет
 * используется ровно так, как должно быть: только по явному действию.
 */
let gisLoadPromise = null;
function ensureGisLoaded(){
  if(window.google && google.accounts && google.accounts.oauth2){
    return Promise.resolve();
  }
  if(gisLoadPromise) return gisLoadPromise;
  gisLoadPromise = loadScriptOnce('https://accounts.google.com/gsi/client')
    .catch(err => { gisLoadPromise = null; throw err; });
  return gisLoadPromise;
}
