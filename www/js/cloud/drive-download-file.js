/* cloud/drive-download-file.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
async function driveDownloadFile(fileId){
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${cloudAccessToken}` }
  });
  if(!res.ok) throw await driveApiError(res, 'Ошибка загрузки с Диска');
  return res.text();
}
