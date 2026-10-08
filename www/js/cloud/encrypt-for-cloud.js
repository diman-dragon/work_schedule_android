/* cloud/encrypt-for-cloud.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
async function encryptForCloud(obj, password){
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const enc = new TextEncoder();
  const cipherBuf = await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, enc.encode(JSON.stringify(obj)));
  return JSON.stringify({ v:1, salt: b64encode(salt), iv: b64encode(iv), data: b64encode(new Uint8Array(cipherBuf)) });
}
