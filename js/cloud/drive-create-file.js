/* cloud/drive-create-file.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
async function driveCreateFile(contentStr){
  const boundary = 'grafboundary';
  const metadata = { name: CLOUD_FILE_NAME, mimeType: 'application/json' };
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${contentStr}\r\n--${boundary}--`;
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST',
    headers: { Authorization: `Bearer ${cloudAccessToken}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body
  });
  if(!res.ok) throw await driveApiError(res, 'Ошибка создания файла на Диске');
  const json = await res.json();
  return json.id;
}
