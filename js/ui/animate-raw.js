/* ui/animate-raw.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
function animateRaw(id, from, to, render, duration){
  if(ledAnimState[id]) cancelAnimationFrame(ledAnimState[id]);
  const start = performance.now();
  const dur = duration || 650;
  function step(now){
    const t = Math.min(1, (now-start)/dur);
    const eased = 1 - Math.pow(1-t, 3);
    const val = from + (to-from)*eased;
    render(val);
    if(t < 1) ledAnimState[id] = requestAnimationFrame(step);
  }
  ledAnimState[id] = requestAnimationFrame(step);
}
