/* ui/animate-number-led.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
function animateNumberLed(id, to, formatter){
  const el = $(id);
  if(!el) return;
  const from = parseFloat((el.dataset.raw||'0')) || 0;
  const f = formatter || (v => Math.round(v).toLocaleString('ru-RU'));
  animateRaw(id, from, to || 0, v => { el.textContent = f(v); }, 650);
  el.dataset.raw = to || 0;
}
