/* cloud/ensure-token-client.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
// ---- Google OAuth (Google Identity Services) ----
function ensureTokenClient(){
  if(cloudTokenClient) return cloudTokenClient;
  if(!window.google || !google.accounts || !google.accounts.oauth2){
    throw new Error('Google-скрипт авторизации ещё не загрузился, попробуйте через секунду');
  }
  cloudTokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLOUD_CLIENT_ID,
    scope: CLOUD_SCOPE,
    callback: () => {} // переопределяется на каждый вызов requestCloudToken
  });
  return cloudTokenClient;
}
