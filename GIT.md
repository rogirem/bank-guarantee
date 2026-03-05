# Загрузка проекта в Git (GitHub)

Пароль и логин **нигде в репозитории не храните**. Выполняйте команды ниже на своём компьютере (или на master, если там ведёте разработку).

## 1. Создать репозиторий на GitHub

1. Зайдите на https://github.com (логин: **rogirem**).
2. New repository → имя, например `bank-guarantee` или `pr4`.
3. Не добавляйте README, .gitignore и лицензию — репозиторий должен быть пустым.

## 2. Инициализация и первый коммит (в каталоге проекта)

В каталоге `bank-guarantee` (или в корне `pr4`, если весь проект в одном репо):

```bash
cd C:\pr4\bank-guarantee
git init
git add .
git commit -m "Docker Swarm: банковская гарантия, NFS, демо отказоустойчивости"
```

Если репозиторий вы создали в папке `pr4` и в Git нужно отправить всё из `pr4`:

```bash
cd C:\pr4
git init
git add .
git commit -m "Docker Swarm: банковская гарантия, NFS, демо отказоустойчивости"
```

## 3. Подключить удалённый репозиторий и отправить код

Подставьте свой URL (логин и имя репозитория):

```bash
git remote add origin https://github.com/rogirem/bank-guarantee.git
git branch -M main
git push -u origin main
```

При запросе пароля используйте **Personal Access Token** (пароль учётной записи GitHub может не подходить).  
Создать токен: GitHub → Settings → Developer settings → Personal access tokens → Generate new token (с правом `repo`).

Для Windows при первом push можно использовать Git Credential Manager — он запросит логин и токен и сохранит их безопасно.

## 4. Не коммитить

- Файлы с паролями и секретами (`.env` с реальными данными).
- `node_modules/` (уже в `.gitignore`).

Если репозиторий уже есть и нужно только обновить его из этой папки — сделайте `git add .`, `git commit`, затем `git push`.
