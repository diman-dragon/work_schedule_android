/* cloud/drive-api-error.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
// ---- Google Drive REST (scope drive.file — видит только файлы этого приложения) ----
async function driveApiError(res, action){
  let detail = '';
  try{
    const body = await res.json();
    detail = (body && body.error && (body.error.message || (body.error.errors && body.error.errors[0] && body.error.errors[0].reason))) || '';
  }catch(e){ /* ignore, body wasn't JSON */ }
  return new Error(`${action}: ${res.status}${detail ? ' — ' + detail : ''}`);
}
