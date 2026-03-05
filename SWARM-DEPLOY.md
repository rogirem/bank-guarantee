# Деплой в Docker Swarm

Краткая выжимка по деплою. **Полная настройка с нуля** (VirtualBox, Ubuntu, Docker, NFS, демо): см. **SETUP-FULL.md**. Демонстрация преподавателю: **DEMO-TEACHER.md**.

## 1. Инициализация Swarm (если ещё не инициализирован)

```bash
docker swarm init
```

## 2. Создание overlay-сети

Сеть должна быть создана **до** `docker stack deploy` и помечена как external в `docker-compose.yaml`:

```bash
docker network create --driver overlay --attachable bank_guarantee_net
```

## 3. Сборка образа backend

Из корня проекта `bank-guarantee`:

```bash
cd bank-guarantee
docker build -t bank-guarantee-backend:latest -f server/Dockerfile .
```

Если образы пушатся в registry (для многоНодового кластера), после сборки:

```bash
docker tag bank-guarantee-backend:latest YOUR_REGISTRY/bank-guarantee-backend:latest
docker push YOUR_REGISTRY/bank-guarantee-backend:latest
```

В `docker-compose.yaml` тогда укажите `image: YOUR_REGISTRY/bank-guarantee-backend:latest`.

## 4. Деплой стека

```bash
docker stack deploy -c docker-compose.yaml bank-guarantee
```

## 5. Проверка

```bash
docker stack services bank-guarantee
docker stack ps bank-guarantee
```

Приложение: **http://&lt;IP-ноды&gt;:3000**  
MySQL: порт **3306** (если открыт на ноде).

## 6. Опционально: данные MySQL на NFS

Если используется NFS (см. `NFS-SETUP.md`), в `docker-compose.yaml` у сервиса `db` замените volumes на:

```yaml
volumes:
  - /mnt/mysqldata:/var/lib/mysql
```

И при необходимости добавьте placement-ограничение по ноде с NFS, например:

```yaml
placement:
  constraints:
    - node.labels.pgdata == true
```

## 7. Удаление стека

```bash
docker stack rm bank-guarantee
```

Сеть и volume останутся; при повторном deploy данные MySQL сохранятся.
