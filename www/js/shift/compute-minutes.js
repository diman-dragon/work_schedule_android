/* shift/compute-minutes.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
function computeMinutes(start, end){
  let s = timeToMin(start), e = timeToMin(end);
  if(e <= s) e += 24*60;
  return e - s;
}
