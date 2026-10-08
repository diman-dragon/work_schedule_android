/* cloud/b64-encode.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
// ---- шифрование ----
function b64encode(bytes){
  let bin = '';
  bytes.forEach(b => bin += String.fromCharCode(b));
  return btoa(bin);
}
