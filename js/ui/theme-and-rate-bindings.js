/* ui/theme-and-rate-bindings.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
// ---------- ПЕРЕКЛЮЧАТЕЛЬ ТЕМЫ ----------
applyTheme(APP.theme === 'dark' ? 'dark' : 'light');
$('themeToggle').addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme');
  applyTheme(cur === 'dark' ? 'light' : 'dark');
  persist();
});

// ---------- СТАВКА ----------
$('rateInput').addEventListener('input', (e) => {
  const v = parseFloat(e.target.value);
  if(!isNaN(v) && v >= 0){
    rate = v;
    recomputeAll();
    renderMonthsStrip();
    render(currentKey);
    persist();
  }
});
