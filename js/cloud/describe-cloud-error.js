/* cloud/describe-cloud-error.js
 * Превращает техническую ошибку синхронизации в понятное объяснение.
 * Раньше пользователь видел только «☁️ ошибка синхронизации» без причины —
 * на мобильном это было особенно неприятно, потому что там чаще всего
 * срабатывает блокировка всплывающего окна Google, и понять это было невозможно.
 */
// Неверный пароль (или повреждённый файл) проявляется как исключение WebCrypto
// при расшифровке AES-GCM. Браузеры отдают его как DOMException с именем
// «OperationError» и текстом вроде «The operation failed for an operation-
// specific reason» — строки «OPERATION_FAILED» в нём нет, поэтому раньше
// проверка по тексту никогда не срабатывала: пользователь видел английское
// сообщение, а неверный пароль так и оставался сохранённым на устройстве.
function isDecryptError(err){
  if(!err) return false;
  if(err.name === 'OperationError') return true;
  return /OPERATION_FAILED|operation failed|decrypt/i.test(err.message ? String(err.message) : '');
}

function describeCloudError(err){
  const msg = (err && err.message) ? String(err.message) : '';

  // Google Identity Services сообщает о заблокированном/закрытом окне входа
  if(/popup_closed|popup_failed_to_open|popup/i.test(msg)){
    return 'окно входа Google заблокировано. Разрешите всплывающие окна для сайта и нажмите ещё раз';
  }
  if(/access_denied|consent/i.test(msg)){
    return 'доступ к Google Диску не подтверждён — нажмите ещё раз и разрешите доступ';
  }
  if(isDecryptError(err)){
    return 'неверный пароль шифрования или повреждён файл в облаке';
  }
  if(/401|invalid credentials|unauthorized/i.test(msg)){
    return 'сессия Google истекла — нажмите ещё раз, чтобы войти';
  }
  if(/403|insufficient|forbidden/i.test(msg)){
    return 'нет доступа к Google Диску — проверьте разрешения приложения';
  }
  if(/429|quota|rate.?limit/i.test(msg)){
    return 'Google временно ограничил запросы — попробуйте через минуту';
  }
  if(/Failed to fetch|NetworkError|network/i.test(msg)){
    return 'нет связи с Google Диском — проверьте интернет';
  }
  if(/не загрузил/i.test(msg)){
    return 'скрипт Google ещё грузится — попробуйте через секунду';
  }
  return 'не удалось синхронизироваться' + (msg ? ' (' + msg + ')' : '');
}
