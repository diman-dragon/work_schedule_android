/* ui/today-button-binding.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
// кнопка "Сегодня"
$('todayBtn')?.addEventListener('click', () => {
  const key = ensureCurrentMonthExists();
  render(key);
  window.scrollTo({top:0, behavior:'smooth'});
  showToast('Текущий месяц открыт');
});
