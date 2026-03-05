# NFS: хранилище на master, подключение worker1 и worker2

Краткая инструкция для **Ubuntu Server**: поднять NFS-сервер на **master**, экспортировать каталог `/mnt/mysqldata`, подключить его на **worker1** и **worker2**.

| Узел    | IP           |
|---------|--------------|
| master  | 192.168.0.1  |
| worker1 | 192.168.0.2  |
| worker2 | 192.168.0.3  |

---

## 1. На виртуалке master (NFS-сервер)

### 1.1. Установка NFS-сервера (Ubuntu Server)

```bash
sudo apt update
sudo apt install -y nfs-kernel-server
```

### 1.2. Каталог для экспорта

Создайте каталог и задайте права (для MySQL в контейнере обычно UID 999):

```bash
sudo mkdir -p /mnt/mysqldata
sudo chown 999:999 /mnt/mysqldata
sudo chmod 700 /mnt/mysqldata
```

### 1.3. Экспорт каталога (NFS v4)

Файл экспортов:

```bash
sudo nano /etc/exports
```

Добавьте одну из строк.

**По подсети** (разрешить всю сеть 192.168.0.x):
```
/mnt/mysqldata 192.168.0.0/24(rw,sync,no_subtree_check,no_root_squash)
```

**Только worker1 и worker2:**
```
/mnt/mysqldata 192.168.0.2(rw,sync,no_subtree_check,no_root_squash)
/mnt/mysqldata 192.168.0.3(rw,sync,no_subtree_check,no_root_squash)
```

Примените экспорты и включите сервис:

```bash
sudo exportfs -ra
sudo systemctl enable --now nfs-kernel-server
```

Проверка:
```bash
sudo exportfs -v
```

---

## 2. На виртуалках worker1 и worker2 (NFS-клиенты)

Выполните одни и те же шаги на **192.168.0.2** (worker1) и **192.168.0.3** (worker2).

### 2.1. Установка NFS-клиента

```bash
sudo apt update
sudo apt install -y nfs-common
```

### 2.2. Точка монтирования

Создайте каталог, куда будет смонтирован NFS (тот же путь, что в `docker-compose`: `/mnt/mysqldata`):

```bash
sudo mkdir -p /mnt/mysqldata
```

### 2.3. Монтирование

По IP master (192.168.0.1):

```bash
sudo mount -t nfs4 192.168.0.1:/mnt/mysqldata /mnt/mysqldata
```

Проверка:
```bash
df -h /mnt/mysqldata
mount | grep mysqldata
```

### 2.4. Постоянное монтирование (fstab)

Чтобы раздел подключался после перезагрузки:

```bash
sudo nano /etc/fstab
```

Добавьте строку:

```
192.168.0.1:/mnt/mysqldata  /mnt/mysqldata  nfs4  defaults,_netdev  0  0
```

`_netdev` — не монтировать до появления сети. Проверка:

```bash
sudo mount -a
df -h /mnt/mysqldata
```

### 2.5. Файрвол на worker’ах

Исходящий трафик на 192.168.0.1 обычно уже разрешён; при ограничениях ufw разрешите доступ к master.

---