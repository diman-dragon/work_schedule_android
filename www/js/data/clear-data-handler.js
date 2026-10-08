/* data/clear-data-handler.js */
$('clearDataBtn').addEventListener('click', async () => {
  if(!order.length){ showToast('Данные уже пусты'); return; }
  const ok = await showConfirmModal(
    'Это действие необратимо. Перед очисткой при необходимости сохраните JSON.',
    'Удалить все данные графика?',
    'Удалить'
  );
  if(!ok) return;
  DATA = {}; order = []; currentKey = null;
  try{ localStorage.removeItem(STORAGE_KEY); }catch(err){}
  persist();
  currentKey = ensureCurrentMonthExists();
  render(currentKey);
  showToast('Все данные удалены');
});
