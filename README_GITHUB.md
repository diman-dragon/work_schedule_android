# Сборка Android через GitHub Actions

Проект специально подготовлен так, чтобы папку `android/` **не нужно было хранить в Git**.
GitHub Actions создаёт её автоматически через Capacitor.

## Как собрать APK

1. Создайте новый GitHub repository.
2. Загрузите содержимое этой папки в repository (важно: `package.json` должен лежать в корне repository).
3. Откройте **Actions → Android APK**.
4. Нажмите **Run workflow**.
5. После завершения откройте результат workflow → **Artifacts** → `work-schedule-debug-apk`.
6. Внутри будет `app-debug.apk`.

Также workflow автоматически запускается при push в `main` или `master`.

## Что делает workflow

- устанавливает Node.js 20;
- устанавливает Java 21;
- устанавливает Android SDK;
- устанавливает npm-зависимости;
- создаёт Android-проект через `npx cap add android`;
- выполняет `npx cap sync android`;
- собирает `app-debug.apk` через Gradle;
- публикует APK как GitHub Actions Artifact.

Папка `android/` намеренно добавлена в `.gitignore`: она генерируется Capacitor при каждой сборке.

## Google Drive

Код Google Drive находится в `js/cloud/` и подключается из `index.html`. Он не удалён и не заменён заглушкой.
