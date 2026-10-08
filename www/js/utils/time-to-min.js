/* utils/time-to-min.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
function timeToMin(t){
  const [h,m] = t.split(':').map(Number);
  return h*60+m;
}
