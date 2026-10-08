/* icons.js — набор линейных иконок (24x24, stroke=currentColor) */
'use strict';

const Icons = (() => {
  const mk = (d) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  return {
    left:    mk('<path d="M14.5 5.5 8 12l6.5 6.5"/>'),
    right:   mk('<path d="M9.5 5.5 16 12l-6.5 6.5"/>'),
    menu:    mk('<circle cx="12" cy="5.5" r="1.1"/><circle cx="12" cy="12" r="1.1"/><circle cx="12" cy="18.5" r="1.1"/>'),
    cloud:   mk('<path d="M7 18a4.5 4.5 0 0 1-.4-8.98A6 6 0 0 1 18 10.5a3.75 3.75 0 0 1-.5 7.5z"/>'),
    sync:    mk('<path d="M20 11a8 8 0 0 0-14.3-4.3L4 8.5"/><path d="M4 4v4.5h4.5"/><path d="M4 13a8 8 0 0 0 14.3 4.3L20 15.5"/><path d="M20 20v-4.5h-4.5"/>'),
    link:    mk('<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3A4.5 4.5 0 0 0 11 19.4l1-1"/>'),
    unlink:  mk('<path d="M9 15 15 9"/><path d="M11 6.5 12.5 5a4.5 4.5 0 0 1 6.4 6.4L17.5 13"/><path d="M13 17.5 11.5 19a4.5 4.5 0 0 1-6.4-6.4L6.5 11"/>'),
    down:    mk('<path d="M12 4v11"/><path d="m7 11 5 5 5-5"/><path d="M5 20h14"/>'),
    up:      mk('<path d="M12 16V5"/><path d="m7 9 5-5 5 5"/><path d="M5 20h14"/>'),
    file:    mk('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>'),
    table:   mk('<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M3.5 10h17M9.5 4.5v15"/>'),
    shield:  mk('<path d="M12 3 5 6v5.5c0 4.3 2.9 8 7 9.5 4.1-1.5 7-5.2 7-9.5V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>'),
    trash:   mk('<path d="M4 7h16"/><path d="M9 7V4.5h6V7"/><path d="M6.5 7l.8 12a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.8-12"/>'),
    palette: mk('<path d="M12 3a9 9 0 1 0 0 18c1.3 0 2-.8 2-1.7 0-1-.9-1.4-.9-2.4 0-.9.7-1.6 1.7-1.6H17a4 4 0 0 0 4-4C21 7 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10.5" cy="7.5" r="1"/><circle cx="15" cy="7.5" r="1"/>'),
    calc:    mk('<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8.5 7.5h7"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01"/>'),
    clock:   mk('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
    check:   mk('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
    gear:    mk('<circle cx="12" cy="12" r="3.2"/><path d="M19.4 13.5a7.7 7.7 0 0 0 0-3l1.8-1.4-1.8-3.1-2.2.8a7.6 7.6 0 0 0-2.6-1.5L14.2 3h-3.6l-.4 2.3a7.6 7.6 0 0 0-2.6 1.5l-2.2-.8-1.8 3.1 1.8 1.4a7.7 7.7 0 0 0 0 3l-1.8 1.4 1.8 3.1 2.2-.8a7.6 7.6 0 0 0 2.6 1.5l.4 2.3h3.6l.4-2.3a7.6 7.6 0 0 0 2.6-1.5l2.2.8 1.8-3.1z"/>'),
    info:    mk('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5"/><path d="M12 7.7h.01"/>')
  };
})();
