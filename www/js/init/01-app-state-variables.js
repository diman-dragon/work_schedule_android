/* init/01-app-state-variables.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
let DATA = APP.months;
let order = sanitizeOrder(APP.order, APP.months);
let rate = APP.rate;
let currentKey = APP.currentKey;
let editingDay = null;
// пары "начало–конец", автобусы и маршруты, которые пользователь скрыл из подсказок
// (напр. случайно введённое время или опечатка) — сама история дней при этом не трогается.
// Скрытие не окончательное: как только точно такое же значение снова сохраняется
// в карточке дня, оно автоматически убирается из соответствующего hidden-набора
// (см. day-modal/save-day-handler.js) — иначе случайно скрытая, но при этом
// регулярно повторяющаяся смена/маршрут пропадала бы из подсказок навсегда.
let hiddenShiftTimes = new Set(Array.isArray(APP.hiddenShiftTimes) ? APP.hiddenShiftTimes : []);
let hiddenBuses = new Set(Array.isArray(APP.hiddenBuses) ? APP.hiddenBuses : []);
let hiddenRoutes = new Set(Array.isArray(APP.hiddenRoutes) ? APP.hiddenRoutes : []);
