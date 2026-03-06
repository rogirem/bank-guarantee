# Исправление кодировки (русский в БД)

Если клиенты и другие данные из БД отображаются с кракозябрами, сделайте по шагам.

## 1. Перезапустить backend с новым кодом

Код уже настроен на UTF-8 (charset в подключении и заголовок ответа). Пересоберите образ и обновите сервис:

```bash
docker build -t bank-guarantee-backend:latest -f server/Dockerfile .
docker service update --force bank-guarantee_backend
```

## 2. Перевести таблицы в utf8mb4 (если ещё не переведены)

В старых версиях Docker нет `docker service exec`, поэтому команду нужно выполнять **на той ноде, где реально крутится контейнер БД**.

**Шаг 1.** На master узнайте, на какой ноде запущен сервис БД:

```bash
sudo docker service ps bank-guarantee_db --no-trunc
```

В колонке **NODE** будет имя ноды (например `master`, `worker1` или `worker2`).

**Шаг 2.** Зайдите на **эту ноду** (по SSH или консоль в VirtualBox) и выполните там (из каталога с проектом, где есть `server/fix-encoding.sql`):

```bash
sudo docker exec -i $(sudo docker ps -q -f name=bank-guarantee_db) mysql -uroot -prootpass bank_guarantee < server/fix-encoding.sql
```

Если файла `fix-encoding.sql` на этой ноде нет, выполните SQL одной командой:

```bash
sudo docker exec -i $(sudo docker ps -q -f name=bank-guarantee_db) mysql -uroot -prootpass bank_guarantee -e "SET NAMES 'utf8mb4'; ALTER TABLE clients CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; ALTER TABLE staff CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; ALTER TABLE guarantee_types CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; ALTER TABLE tariffs CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; ALTER TABLE applications CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; ALTER TABLE history CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; ALTER TABLE documents CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

## 3. Если после шагов 1–2 кодировка всё равно неправильная

Значит, данные когда-то записались в неправильной кодировке (например, UTF-8 попал в колонку с latin1). Исправить уже сохранённые строки без потери смысла сложно. Самый надёжный вариант — **обнулить БД и заново применить схему с начальными данными**.

### Сброс данных БД (все таблицы и данные удаляются)

**На ноде, где лежат данные MySQL** (master, если данные в `/mnt/mysqldata`):

1. Снять стек (чтобы MySQL не использовал каталог):

```bash
docker stack rm bank-guarantee
```

2. Дождаться остановки всех задач: `docker stack ps bank-guarantee` не должен показывать задачи стека.

3. Очистить каталог данных MySQL (подставьте путь к вашей NFS/volume):

```bash
sudo rm -rf /mnt/mysqldata/*
```

4. Снова задеплоить стек:

```bash
docker stack deploy -c docker-compose.yaml bank-guarantee
```

После первого запуска MySQL создаст БД заново и выполнит скрипты из `docker-entrypoint-initdb.d/` (в т.ч. схему с `SET NAMES utf8mb4` и начальными данными). Клиенты и остальные данные будут в нормальной кодировке.

**Важно:** это удаляет все текущие данные в БД. Если нужно что-то сохранить — сделайте дамп перед очисткой.
