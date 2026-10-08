/* day-modal/add-month-open-bindings.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
// ---------- ДОБАВЛЕНИЕ МЕСЯЦА ----------
const addMonthOverlay = $('addMonthOverlay');
const addMonthInput = $('addMonthInput');
$('addMonthBtn').addEventListener('click', () => {
  // подставляем месяц, следующий за последним в текущем графике
  let y, mo;
  if(order.length){
    const last = DATA[order[order.length-1]];
    y = last.year; mo = last.month + 1;
    if(mo > 12){ mo = 1; y += 1; }
  } else {
    const now = new Date();
    y = now.getFullYear(); mo = now.getMonth()+1;
  }
  addMonthInput.value = `${y}-${String(mo).padStart(2,'0')}`;
  addMonthOverlay.classList.add('show');
  setTimeout(() => addMonthInput.focus(), 50);
});
$('addMonthCancelBtn').addEventListener('click', () => addMonthOverlay.classList.remove('show'));
addMonthOverlay.addEventListener('click', (e) => { if(e.target === addMonthOverlay) addMonthOverlay.classList.remove('show'); });
