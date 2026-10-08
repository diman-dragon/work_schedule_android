/* cloud/drive-update-file.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
async function driveUpdateFile(fileId, contentStr){
  const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${cloudAccessToken}`, 'Content-Type': 'application/json' },
    body: contentStr
  });
  if(!res.ok) throw await driveApiError(res, 'Ошибка сохранения на Диск');
}
