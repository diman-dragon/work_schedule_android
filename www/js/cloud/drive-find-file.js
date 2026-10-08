/* cloud/drive-find-file.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
async function driveFindFile(){
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`name='${CLOUD_FILE_NAME}' and trashed=false`)}&spaces=drive&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${cloudAccessToken}` }
  });
  if(!res.ok) throw await driveApiError(res, 'Ошибка поиска файла на Диске');
  const json = await res.json();
  return (json.files && json.files[0]) ? json.files[0].id : null;
}
