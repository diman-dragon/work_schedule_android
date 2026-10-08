/* cloud/b64-decode.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
function b64decode(str){
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
