# Рабочий график — Capacitor Android

Упрощённая Android-версия исходного приложения. Оставлено:

- календарь/график смен;
- редактирование рабочих дней и времени начала/окончания;
- автобус и маршрут;
- ставка;
- подсчёт часов, смен и заработка;
- локальное сохранение;
- импорт/экспорт JSON;
- Google Drive синхронизация исходной версии;
- шифрование облачного файла AES-256-GCM/PBKDF2;
- светлая/тёмная тема.

Удалено:

- все графики Chart.js;
- вкладка статистики и сравнительные карточки;
- тепловая карта;
- фотографии дней;
- печатный табель;
- CSV и локальные бэкапы;
- прочие визуальные статистические модули.

## Android

```bash
npm install
npx cap add android
npx cap sync android
npx cap open android
```

Для сборки APK используй Android Studio или:

```bash
npx cap sync android
cd android
./gradlew assembleDebug
```

## Google Drive

Используется OAuth Client ID исходного приложения и scope `drive.file`. Данные на Drive сохраняются зашифрованными в файле `rabochiy-grafik-sync.json.enc`. Пароль задаётся пользователем.

Важно: для публикации в Google Play/OAuth-конфигурации Android необходимо проверить разрешённые origin/redirect URI в Google Cloud Console для конкретной Android-сборки. Веб-логика Google Identity Services сохранена из исходного проекта.
