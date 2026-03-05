# Загрузка проекта в Git (GitHub)

Логин и пароль/токен в репозитории не хранить. GitHub для Git-операций требует Personal Access Token (пароль учетной записи не подходит).

## Быстрый вариант: один скрипт (создать репо и запушить)

1. Создайте токен: https://github.com/settings/tokens (права: repo).
2. В каталоге `bank-guarantee` выполните (подставьте свой токен):

```powershell
$env:GITHUB_TOKEN = "ваш_токен"
.\push-to-github.ps1
```

Скрипт создаст репозиторий `rogirem/bank-guarantee`, если его еще нет, и выполнит push. После этого URL remote будет без токена.

## Ручной вариант

1. Создать репозиторий на GitHub: https://github.com/new , имя `bank-guarantee`, без README.
2. Локально уже выполнено: `git init`, `git add .`, `git commit`, `git remote add origin https://github.com/rogirem/bank-guarantee.git`.
3. Запушить с токеном (при запросе пароля ввести токен вместо пароля):

```bash
git push -u origin main
```

Токен: GitHub -> Settings -> Developer settings -> Personal access tokens -> Generate (scope repo).

## Не коммитить

- Файлы с паролями и секретами (`.env`).
- `node_modules/` (уже в `.gitignore`).
