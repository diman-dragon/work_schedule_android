/* cloud/request-cloud-token.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
async function requestCloudToken(interactive){
  // уже есть живой (не просроченный) токен в памяти/кэше сессии — переиспользуем
  // его и вообще не дёргаем Google. Именно отсутствие такой проверки раньше
  // заставляло ходить в Google на каждую перезагрузку страницы.
  if(cloudAccessToken && cloudTokenExpiresAt > Date.now() + 60000){
    return cloudAccessToken;
  }
  // Google-скрипт теперь не грузится заранее (см. cloud/ensure-gis-loaded.js) —
  // подгружаем его прямо здесь, внутри клика по кнопке синхронизации.
  await ensureGisLoaded();
  return new Promise((resolve, reject) => {
    let client;
    try{ client = ensureTokenClient(); } catch(err){ reject(err); return; }
    client.callback = (resp) => {
      if(resp && resp.access_token){
        cloudAccessToken = resp.access_token;
        // expires_in приходит в секундах от Google — переводим в абсолютную метку времени
        cloudTokenExpiresAt = Date.now() + (Number(resp.expires_in || 3600) * 1000);
        try{
          sessionStorage.setItem(CLOUD_TOKEN_CACHE_KEY, JSON.stringify({ token: cloudAccessToken, expiresAt: cloudTokenExpiresAt }));
        }catch(err){ /* sessionStorage недоступен (приватный режим и т.п.) — не критично */ }
        localStorage.setItem(CLOUD_CONSENT_GIVEN_KEY, '1');
        resolve(resp.access_token);
      }
      else reject(new Error('Не удалось получить доступ к Google-аккаунту'));
    };
    client.error_callback = (err) => reject(new Error(err && err.type ? err.type : 'Ошибка авторизации Google'));
    // 'consent' (экран подтверждения доступа) запрашиваем ТОЛЬКО при самом первом
    // подключении на этом устройстве. При всех следующих обращениях, даже
    // интерактивных (по клику), просим пустой prompt — тогда Google, если доступ
    // уже когда-то давали, выдаёт токен без единого лишнего окна, максимум мелькнёт
    // выбор аккаунта. Раньше здесь стояло 'consent' на каждый клик, из-за чего
    // Google каждый раз заново спрашивал разрешение — это и есть та самая
    // "постоянно просит войти" проблема.
    const firstTimeConsent = interactive && localStorage.getItem(CLOUD_CONSENT_GIVEN_KEY) !== '1';
    client.requestAccessToken({ prompt: firstTimeConsent ? 'consent' : '' });
  });
}
