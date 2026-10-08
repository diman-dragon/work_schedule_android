/* ui/apply-theme.js */
function applyTheme(t){
  document.documentElement.setAttribute('data-theme', t);
  $('themeToggle').textContent = t === 'dark' ? '🌙' : '☀️';
}
