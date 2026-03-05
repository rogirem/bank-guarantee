# Полная настройка: VirtualBox, Ubuntu 22.04, Docker Swarm

Три машины: **master**, **worker1**, **worker2**. Цель: стек "Банковская гарантия" в Swarm с демонстрацией отказоустойчивости (убить ноду с БД, через время доступ и данные восстанавливаются).

---

## 1. VirtualBox: три виртуалки

### 1.1. Создание ВМ

Создайте три виртуалки (например, имя: `ubuntu-master`, `ubuntu-worker1`, `ubuntu-worker2`):

- **Тип:** Linux, Ubuntu (64-bit)
- **RAM:** минимум 2 ГБ (лучше 2-4 ГБ на каждую)
- **Диск:** 20-30 ГБ, динамический
- **Сеть:** **Сетевой мост** (Bridged Adapter) или **Внутренняя сеть** (Host-only / Internal network), чтобы машины видели друг друга по IP

Если используете **Внутреннюю сеть**: создайте в VirtualBox сеть (Файл -> Менеджер сетей -> Создать), назовите например `intnet`, и у всех трёх ВМ выберите эту сеть.

### 1.3. Доступ с хоста по 192.168.0.1:3000

Чтобы открывать приложение **с вашего ПК (хоста)** в браузере по адресу `http://192.168.0.1:3000`, нужно:

1. **Виртуалка master должна иметь IP 192.168.0.1** (назначьте статический IP на master, см. ниже).
2. **Хост и виртуалки должны быть в одной сети.** Удобнее всего:
   - **Сетевой мост (Bridged):** виртуалки получают IP в той же подсети, что и хост (например 192.168.0.x). На master задайте статический IP 192.168.0.1. Тогда с хоста в браузере: `http://192.168.0.1:3000`.
   - **Host-only:** в VirtualBox (Файл -> Менеджер сетей хоста) создайте сеть, например с адресом 192.168.0.0/24. Хост получит 192.168.0.1, виртуалкам выдайте 192.168.0.2, 192.168.0.3, 192.168.0.4. Тогда с хоста открывайте `http://192.168.0.2:3000` (если master — 192.168.0.2). Если нужно именно 192.168.0.1:3000 — назначьте master IP 192.168.0.1, а хосту в этой сети другой адрес или используйте мост.

**Назначить статический IP 192.168.0.1 на master (Ubuntu 22.04):**

```bash
sudo nano /etc/netplan/00-installer-config.yaml
```

Содержимое (подставьте имя интерфейса из `ip a`, например `enp0s3`):

```yaml
network:
  version: 2
  ethernets:
    enp0s3:
      addresses: [192.168.0.1/24]
      # Если нужен DHCP-шлюз и DNS, добавьте:
      # gateway4: 192.168.0.1
      # nameservers: { addresses: [8.8.8.8] }
```

Применить:

```bash
sudo netplan apply
```

После этого с хоста (если он в той же подсети) откройте в браузере: **http://192.168.0.1:3000**.

### 1.4. Установка Ubuntu Server 22.04 LTS

На каждой ВМ загрузите образ Ubuntu Server 22.04, установите (можно «Minimal» или стандартный сервер). При установке укажите:

- Имя хоста: master, worker1, worker2
- Пользователь и пароль (один и тот же на всех для удобства, например `swarm`)
- SSH: установить OpenSSH server (галочка в установщике)

После установки зафиксируйте IP (через `ip a` или `hostname -I`). Дальше в примерах (master = 192.168.0.1, чтобы с хоста заходить по http://192.168.0.1:3000):

| Узел    | IP (пример)  |
|---------|---------------|
| master  | 192.168.0.1   |
| worker1 | 192.168.0.2   |
| worker2 | 192.168.0.3   |

Или посмотрите IP в VirtualBox (Диспетчер сетей) / через `ip a` на каждой машине.

---

## 2. Что установить на серверах (все три)

На **каждой** машине (master, worker1, worker2) выполните:

### 2.1. Обновление и базовые пакеты

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl
```

### 2.2. Docker (официальный репозиторий)

```bash
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Проверка: `docker --version`, `docker compose version`.

### 2.3. Добавить пользователя в группу docker (чтобы без sudo)

```bash
sudo usermod -aG docker $USER
```

Выйдите из сессии и зайдите снова (или перезагрузите ВМ), чтобы группа применилась.

### 2.4. Открыть порты в firewall (если ufw включён)

На **master** (и при необходимости на worker, если с них заходите по IP):

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 2377/tcp  # Swarm management
sudo ufw allow 7946/tcp  # Swarm node communication
sudo ufw allow 7946/udp
sudo ufw allow 4789/udp  # overlay
sudo ufw allow 3000/tcp  # веб-приложение
sudo ufw allow 3306/tcp  # MySQL (по желанию)
sudo ufw allow 2049/tcp  # NFS (если NFS через ufw)
sudo ufw allow 111/tcp
sudo ufw allow 111/udp
sudo ufw enable
```

---

## 3. Docker Swarm: создать кластер

### 3.1. На master

```bash
docker swarm init
```

Команда выведет что-то вроде:

```text
docker swarm join --token SWMTKN-1-... 192.168.0.1:2377
```

Эту строку нужно выполнить на worker1 и worker2.

Если у master несколько сетевых интерфейсов, укажите advertise-адрес:

```bash
docker swarm init --advertise-addr 192.168.0.1
```

(подставьте реальный IP master).

### 3.2. На worker1 и worker2

Вставьте выданную командой строку (с вашим токеном и IP):

```bash
docker swarm join --token SWMTKN-1-... 192.168.0.1:2377
```

Проверка на master:

```bash
docker node ls
```

Должны быть три ноды, одна со статусом Leader (master), две Reachable (worker).

### 3.3. Метки для нод (чтобы БД могла запускаться на любой ноде с NFS)

На master выполните (подставьте имена нод из `docker node ls`):

```bash
docker node update --label-add mysqldata=true master
docker node update --label-add mysqldata=true worker1
docker node update --label-add mysqldata=true worker2
```

Имена нод могут быть как hostname (master, worker1, worker2), так и ID. Проверка: `docker node inspect master --format '{{.Spec.Labels}}'`.

---

## 4. NFS: общее хранилище для MySQL

Чтобы после "убийства" ноды с БД контейнер MySQL мог подняться на другой ноде с теми же данными, каталог данных должен быть общим - через NFS.

### 4.1. На master (NFS-сервер)

```bash
sudo apt install -y nfs-kernel-server
sudo mkdir -p /mnt/mysqldata
sudo chown 999:999 /mnt/mysqldata
sudo chmod 700 /mnt/mysqldata
```

В `/etc/exports` добавьте (IP worker’ов или подсеть):

```bash
sudo nano /etc/exports
```

Строка (подсеть 192.168.0.0/24):

```text
/mnt/mysqldata 192.168.0.0/24(rw,sync,no_subtree_check,no_root_squash)
```

Применить и включить NFS:

```bash
sudo exportfs -ra
sudo systemctl enable --now nfs-kernel-server
```

### 4.2. На worker1 и worker2 (NFS-клиенты)

На **каждом** worker:

```bash
sudo apt install -y nfs-common
sudo mkdir -p /mnt/mysqldata
sudo mount -t nfs4 192.168.0.1:/mnt/mysqldata /mnt/mysqldata
```

Постоянно (после перезагрузки): в `/etc/fstab` добавьте:

```text
192.168.0.1:/mnt/mysqldata  /mnt/mysqldata  nfs4  defaults,_netdev  0  0
```

Проверка: `df -h /mnt/mysqldata` и `ls /mnt/mysqldata`.

---

## 5. Сборка образа и деплой стека

Все команды ниже — **на master**, из каталога с проектом (где лежит `docker-compose.yaml`).

### 5.1. Скопировать проект на master

Если проект на вашем ПК — скопируйте папку `bank-guarantee` на master (через SCP, Git и т.п.), например с хоста:

```bash
scp -r bank-guarantee swarm@192.168.0.1:~/
```

Или клонировать репозиторий на master и зайти в папку приложения.

### 5.2. Создать overlay-сеть

На master:

```bash
cd ~/bank-guarantee   # или путь к проекту
docker network create --driver overlay --attachable bank_guarantee_net
```

### 5.3. Собрать образ backend

На master, в каталоге проекта (родитель каталога `server/`):

```bash
docker build -t bank-guarantee-backend:latest -f server/Dockerfile .
```

Образ должен появиться: `docker images | grep bank-guarantee`.

В многоНодовом кластере образ нужен на той ноде, где будет запускаться backend. По умолчанию backend привязан к manager (master), поэтому сборки на master достаточно. Если позже захотите запускать backend на worker’ах — образ нужно туда доставить (registry или `docker save`/`docker load`).

### 5.4. Задеплоить стек

```bash
docker stack deploy -c docker-compose.yaml bank-guarantee
```

Проверка:

```bash
docker stack services bank-guarantee
docker stack ps bank-guarantee
```

Приложение: в браузере откройте `http://192.168.0.1:3000` (IP master). Должен открыться интерфейс «Банковская гарантия».

---

## 6. Демонстрация преподавателю: Swarm и восстановление после падения ноды с БД

Смысл (как в формулировке преподавателя):

1. Внести изменения в базу (через веб-интерфейс).
2. "Прибить" ноду (виртуалку), на которой крутится контейнер с СУБД.
3. Показать: веб-сервис доступен, но обратиться к базе не может (ошибки).
4. Через несколько секунд (до минуты) Swarm поднимает контейнер БД на другой ноде (данные с NFS), обращение восстанавливается, все записи на месте.

### 6.1. Подготовка к демо

- Убедитесь, что стек задеплоен и приложение открывается: `http://<IP-master>:3000`.
- Создайте в приложении несколько записей (клиенты, заявки и т.д.) — это «изменения в базу».

### 6.2. Узнать, на какой ноде сейчас работает контейнер БД

На master:

```bash
docker service ps bank-guarantee_db --no-trunc
```

В колонке **NODE** будет имя ноды (например `worker1`). Эту ноду и нужно будет «убить».

### 6.3. Проверить, что веб и БД работают

- Обновите страницу приложения, откройте разделы с данными — всё должно грузиться.
- Можно в отдельном терминале держать цикл проверки API:

```bash
while true; do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/bootstrap; sleep 2; done
```

(на master; если backend слушает на 3000). Должны быть ответы 200.

### 6.4. «Прибить» ноду с БД

Вариант А — выключить виртуалку в VirtualBox (ту, на которой в `docker service ps` показана задача `bank-guarantee_db`).  
Вариант Б — на самой этой ноде: `sudo poweroff` или `sudo init 0`.

Через несколько секунд:

- Цикл с `curl` начнёт выдавать 500 или таймауты — «веб доступен, но к базе обратиться не может».
- На master: `docker node ls` — одна нода станет Down/Unreachable.
- `docker service ps bank-guarantee_db` — задача на упавшей ноде будет Shutdown, затем появится новая задача на другой ноде (Replicated … Running).

### 6.5. Дождаться восстановления

Подождите до минуты. MySQL на новой ноде поднимется и подключится к тем же данным на NFS (`/mnt/mysqldata`).

- Снова проверьте `docker service ps bank-guarantee_db` — контейнер в состоянии Running на другой ноде.
- Обновите страницу приложения — данные должны отображаться, все ранее сделанные записи на месте. Цикл `curl` снова начнёт возвращать 200.

Кратко для преподавателя: «Мы внесли данные в БД, отключили виртуалку с MySQL. Веб работал, но к базе обратиться было нельзя. Через некоторое время Swarm перенёс контейнер БД на другую ноду, данные подтянулись с общего NFS — доступ и записи восстановились».

### 6.6. Вернуть выключенную ноду (по желанию)

Включите виртуалку снова. В Swarm она снова станет Ready; при следующем обновлении сервисов задачи могут распределиться по всем нодам.

---

## 7. SSH с хоста на master: зачем и как

**Зачем:** управлять кластером с вашего ПК (Windows/Linux/macOS): зайти по SSH на master и выполнять docker stack deploy, docker service ls и т.д., не открывая консоль виртуалки в VirtualBox.

**Как:**

1. На master уже должен быть установлен OpenSSH server (при установке Ubuntu).
2. С хоста проверьте доступность порта (подставьте IP master):  
   `ping 192.168.0.1`  
   `ssh swarm@192.168.0.1`  
   (логин/пароль — те, что задали при установке Ubuntu).
3. Удобно использовать ключи и (опционально) конфиг SSH.

**Генерация ключа на хосте (один раз):**

```bash
ssh-keygen -t ed25519 -f ~/.ssh/swarm_master -N ""
```

**Копирование ключа на master:**

```bash
ssh-copy-id -i ~/.ssh/swarm_master.pub swarm@192.168.0.1
```

Дальше вход без пароля: `ssh -i ~/.ssh/swarm_master swarm@192.168.0.1`.

**Пример конфига** (на хосте в `~/.ssh/config`):

```text
Host swarm-master
    HostName 192.168.0.1
    User swarm
    IdentityFile ~/.ssh/swarm_master
```

Тогда: `ssh swarm-master`, и уже из сессии на master выполняете все `docker stack` / `docker service` / `docker node` команды.

---

## 8. Полезные команды

| Действие | Команда |
|----------|--------|
| Список сервисов стека | `docker stack services bank-guarantee` |
| Где крутятся задачи | `docker stack ps bank-guarantee` |
| Только БД | `docker service ps bank-guarantee_db` |
| Список нод | `docker node ls` |
| Логи backend | `docker service logs bank-guarantee_backend` |
| Логи БД | `docker service logs bank-guarantee_db` |
| Удалить стек | `docker stack rm bank-guarantee` |

---

## 9. Возможные проблемы

- **«network bank_guarantee_net not found»** — создайте сеть:  
  `docker network create --driver overlay --attachable bank_guarantee_net`
- **«no suitable node» для сервиса db** — на всех нодах должна быть метка `mysqldata=true` и смонтирован `/mnt/mysqldata` (NFS). Проверьте: `docker node ls`, затем `docker node inspect NODE --format '{{.Spec.Labels}}'`.
- **Backend не находит БД** — убедитесь, что сервис `db` в состоянии Running: `docker service ps bank-guarantee_db`. Имена сервисов в overlay-сети разрешаются по имени (`db`, `backend`).
- **После перезагрузки master** Swarm поднимается сам; после перезагрузки worker’ов они снова присоединяются к кластеру. NFS на worker’ах должен быть в fstab, чтобы `/mnt/mysqldata` монтировался при загрузке.

Если что-то не совпадает (другие имена нод, другой IP) - замените в командах и в docker-compose.yaml на свои значения.
