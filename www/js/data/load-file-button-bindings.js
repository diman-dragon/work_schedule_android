/* data/load-file-button-bindings.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
const loadFileInput = $('loadFileInput');
$('loadFileBtn').addEventListener('click', loadJsonFile);
loadFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try{ applyLoadedJson(ev.target.result, file.name); }
    catch(err){ showToast('Ошибка чтения файла: ' + err.message); }
  };
  reader.onerror = () => showToast('Не удалось прочитать файл');
  reader.readAsText(file, 'utf-8');
  loadFileInput.value = '';
});
