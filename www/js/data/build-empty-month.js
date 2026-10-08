/* data/build-empty-month.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
function buildEmptyMonth(year, monthIdx1based){
  const label = monthNamesNom[monthIdx1based-1];
  const daysInMonth = new Date(year, monthIdx1based, 0).getDate();
  const days = [];
  for(let day=1; day<=daysInMonth; day++){
    const dt = new Date(year, monthIdx1based-1, day);
    const wd = WEEKDAYS_ORDER[(dt.getDay()+6)%7];
    const dd = String(day).padStart(2,'0');
    const mm = String(monthIdx1based).padStart(2,'0');
    days.push({ date: `${dd}.${mm}.${year}`, weekday: wd, start:null, end:null, minutes:null, hours:null, sum:null, edited:false });
  }
  return { year, month: monthIdx1based, label, days, total_minutes:0, total_sum:0 };
}
