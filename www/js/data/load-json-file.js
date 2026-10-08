/* data/load-json-file.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
// Если браузер поддерживает File System Access API — показываем настоящий системный
// диалог "Открыть файл". Иначе — откатываемся на скрытый <input type="file">
// (он тоже открывает системный диалог выбора файла, просто более простым способом).
async function loadJsonFile(){
  if(window.showOpenFilePicker){
    try{
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'JSON файл', accept: {'application/json': ['.json']} }]
      });
      const file = await handle.getFile();
      const text = await file.text();
      applyLoadedJson(text, file.name);
      return;
    } catch(err){
      if(err.name === 'AbortError') return;
      console.error('Не удалось открыть через системный диалог', err);
    }
  }
  loadFileInput.click();
}
