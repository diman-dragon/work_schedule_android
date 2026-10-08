/* ui/render-wrap-month-label.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
// подпись месяца в шапке навигации всегда актуальна — оборачиваем render() один раз
if(typeof window.__enhancedRenderWrapped === 'undefined'){
  window.__enhancedRenderWrapped = true;
  const originalRender = render;
  window.render = function(key){
    const result = originalRender(key);
    const m = DATA[currentKey];
    const label = $('monthNavLabel');
    if(label && m) label.textContent = `${m.label} ${m.year}`;
    return result;
  };
}
