/* data/validate-loaded-data.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 *
 * УСИЛЕНО: раньше проверялась только верхнеуровневая структура (months/order,
 * и что у месяца есть days/year/month) — содержимое самих дней вообще не
 * проверялось. Файл с датой "2026-99-99", временем "не-время" или числовым
 * полем sum, равным строке или гигантскому числу, проходил бы валидацию и
 * ломал бы расчёты и отрисовку уже после загрузки. Теперь проверяем и это.
 */
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^(\d{2})\.(\d{2})\.(\d{4})$/;

function validateLoadedData(obj){
  if(!obj || typeof obj !== 'object') throw new Error('файл не является JSON-объектом');
  if(!obj.months || typeof obj.months !== 'object') throw new Error('в файле отсутствует корректное поле months');
  if(!Array.isArray(obj.order)) throw new Error('в файле отсутствует корректное поле order');
  const keys = Object.keys(obj.months);
  for(const key of keys){
    const m = obj.months[key];
    if(!m || !Array.isArray(m.days) || typeof m.year !== 'number' || typeof m.month !== 'number'){
      throw new Error('структура одного из месяцев повреждена');
    }
    if(!Number.isInteger(m.month) || m.month < 1 || m.month > 12 || !Number.isInteger(m.year) || m.year < 2000 || m.year > 2100){
      throw new Error(`некорректный месяц/год в "${key}"`);
    }
    for(const d of m.days){
      if(!d || typeof d !== 'object') throw new Error(`повреждена запись дня в "${key}"`);
      if(d.date != null){
        if(typeof d.date !== 'string'){
          throw new Error(`некорректная дата у одного из дней в "${key}"`);
        }
        const match = d.date.match(DATE_RE);
        if(!match){
          throw new Error(`некорректная дата у одного из дней в "${key}"`);
        }
        const day = Number(match[1]);
        const month = Number(match[2]);
        const year = Number(match[3]);
        const daysInMonth = new Date(year, month, 0).getDate();
        if(month < 1 || month > 12 || day < 1 || day > daysInMonth || year < 2000 || year > 2100){
          throw new Error(`некорректная дата у одного из дней в "${key}"`);
        }
        if(year !== m.year || month !== m.month){
          throw new Error(`дата дня не соответствует месяцу "${key}"`);
        }
      }
      if(d.start != null && (typeof d.start !== 'string' || !TIME_RE.test(d.start))){
        throw new Error(`некорректное время начала смены в "${key}"`);
      }
      if(d.end != null && (typeof d.end !== 'string' || !TIME_RE.test(d.end))){
        throw new Error(`некорректное время конца смены в "${key}"`);
      }
      // верхняя граница с запасом: смена до 23ч59м + фиксированный довоз до гаража
      // (GARAGE_RETURN_MIN) может немного превысить 24 часа, и такой день валиден
      if(d.minutes != null && (typeof d.minutes !== 'number' || !Number.isFinite(d.minutes) || d.minutes < 0 || d.minutes > 24*60 + 60)){
        throw new Error(`некорректная длительность смены в "${key}"`);
      }
      if(d.sum != null && (typeof d.sum !== 'number' || !Number.isFinite(d.sum) || d.sum < 0)){
        throw new Error(`некорректная сумма заработка в "${key}"`);
      }
      if(d.bus != null && typeof d.bus !== 'string'){
        throw new Error(`некорректное поле "автобус" в "${key}"`);
      }
      if(d.route != null && typeof d.route !== 'string'){
        throw new Error(`некорректное поле "маршрут" в "${key}"`);
      }
      if(d.photo != null && (typeof d.photo !== 'string' || !d.photo.startsWith('data:image/'))){
        throw new Error(`некорректное фото у одного из дней в "${key}"`);
      }
    }
  }
}
