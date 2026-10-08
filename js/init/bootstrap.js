/* init/bootstrap.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
// init
currentKey = ensureCurrentMonthExists();
APP.currentKey = currentKey;
$('rateInput').value = rate;
render(currentKey);
$('monthNavLabel') && ($('monthNavLabel').textContent = `${DATA[currentKey].label} ${DATA[currentKey].year}`);
// Если localStorage был пуст при открытии, не записываем сюда только что
// созданный пустой месяц: это должно остаться признаком «локальных данных нет»
// до решения пользователя — загрузить облако или начать новый локальный график.
if(HAS_LOCAL_DATA){
  persist();
}else if(typeof offerInitialCloudRestore === 'function'){
  setTimeout(() => offerInitialCloudRestore(), 0);
}
