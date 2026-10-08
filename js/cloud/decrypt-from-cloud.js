/* cloud/decrypt-from-cloud.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
async function decryptFromCloud(payloadStr, password){
  const payload = JSON.parse(payloadStr);
  const salt = b64decode(payload.salt);
  const iv = b64decode(payload.iv);
  const key = await deriveKey(password, salt);
  const plainBuf = await crypto.subtle.decrypt({name:'AES-GCM', iv}, key, b64decode(payload.data));
  return JSON.parse(new TextDecoder().decode(plainBuf));
}
