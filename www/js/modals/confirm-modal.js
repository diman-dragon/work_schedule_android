/* modals/confirm-modal.js
 * Общая модалка подтверждения (замена системного confirm()).
 * Возвращает Promise<boolean>: true если пользователь подтвердил, false — отменил.
 */
const confirmTitleEl = $('confirmTitle');
const confirmMessageEl = $('confirmMessage');
const confirmModal = createPromiseModal({
  overlayId: 'confirmOverlay',
  cancelBtnId: 'confirmCancelBtn',
  okBtnId: 'confirmOkBtn',
  cancelValue: false,
  okValue: true,
});

function showConfirmModal(message, title, okLabel){
  confirmTitleEl.textContent = title || 'Подтверждение';
  confirmMessageEl.textContent = message;
  confirmModal.okBtn.textContent = okLabel || 'Подтвердить';
  return confirmModal.open();
}
