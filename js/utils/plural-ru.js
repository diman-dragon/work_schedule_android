/* utils/plural-ru.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
function pluralRu(n, forms){
  const abs = Math.abs(Math.round(n));
  const n10 = abs % 10, n100 = abs % 100;
  if(n100 >= 11 && n100 <= 14) return forms[2];
  if(n10 === 1) return forms[0];
  if(n10 >= 2 && n10 <= 4) return forms[1];
  return forms[2];
}
