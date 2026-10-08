/* day-modal/day-modal-basic-bindings.js
 * Автоматически выделено из монолитного index.html при разбиении на модули.
 */
workSwitch.addEventListener('click', () => {
  const on = !workSwitch.classList.contains('on');
  workSwitch.classList.toggle('on', on);
  timeFields.style.display = on ? 'block' : 'none';
  updatePreview();
});
workSwitch.addEventListener('keydown', (e) => {
  if(e.key === ' '){ e.preventDefault(); workSwitch.click(); }
});
startInput.addEventListener('input', updatePreview);
endInput.addEventListener('input', updatePreview);
$('cancelBtn').addEventListener('click', closeModal);
overlay.addEventListener('click', (e) => { if(e.target === overlay) closeModal(); });
