-- Кодировка для русского и других символов
SET NAMES 'utf8mb4';

CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  inn VARCHAR(20),
  contact VARCHAR(255)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS staff (
  id VARCHAR(255) AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS guarantee_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tariffs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  guarantee_type_id INT,
  commission_percent DECIMAL(5,2),
  min_commission DECIMAL(15,2),
  FOREIGN KEY (guarantee_type_id) REFERENCES guarantee_types(id)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT,
  manager_id INT,
  guarantee_type_id INT,
  amount DECIMAL(15,2),
  term_days INT,
  commission DECIMAL(15,2),
  check_status VARCHAR(50) DEFAULT 'Новая',
  issue_status VARCHAR(50) DEFAULT 'Не выпущена',
  registration_status VARCHAR(50) DEFAULT 'Не зарегистрирована',
  beneficiary VARCHAR(255),
  comment VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (manager_id) REFERENCES staff(id),
  FOREIGN KEY (guarantee_type_id) REFERENCES guarantee_types(id)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT,
  stage VARCHAR(128),
  comment VARCHAR(500),
  ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT,
  doc_type VARCHAR(32),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Начальные данные
INSERT INTO clients (name, inn, contact) VALUES
('ООО "СтройКомплекс"', '7701234567', 'info@stroykom.ru, +7 (495) 123-45-67'),
('ИП Иванов Иван Иванович', '7708765432', 'ivanov@mail.ru, +7 (495) 987-65-43'),
('ООО "Торговый Дом"', '7701112233', 'td@trade.ru, +7 (812) 111-22-33');

INSERT INTO staff (name, role) VALUES
('Петров Петр Петрович', 'Менеджер'),
('Сидорова Анна Сергеевна', 'Риск-аналитик'),
('Козлов Дмитрий Владимирович', 'Юрист'),
('Смирнова Елена Александровна', 'Менеджер');

INSERT INTO guarantee_types (name) VALUES
('Тендерная'),
('Исполнения обязательств'),
('Возврата аванса');

INSERT INTO tariffs (guarantee_type_id, commission_percent, min_commission) VALUES
(1, 2.5, 50000),
(2, 3.0, 75000),
(3, 2.0, 40000);

-- Тестовые заявки с разными статусами (как в примере Ильи)
INSERT INTO applications (client_id, manager_id, guarantee_type_id, amount, term_days, commission, check_status, issue_status, registration_status, beneficiary, comment, created_at) VALUES
(1, 1, 1, 3000000, 180, 36986.30, 'Одобрено', 'Выпущена', 'Зарегистрирована', 'ООО "Заказчик"', 'Гарантия для участия в тендере', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(2, 1, 2, 5000000, 365, 150000.00, 'Одобрено', 'Выпущена', 'Зарегистрирована', 'АО "Подрядчик"', 'Гарантия исполнения обязательств', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(3, 4, 3, 1500000, 90, 7397.26, 'Одобрено', 'Выпущена', 'Не зарегистрирована', 'ИП Смирнов', 'Гарантия возврата аванса', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(1, 1, 1, 8000000, 180, 98630.14, 'Отказ', 'Не выпущена', 'Не зарегистрирована', 'ООО "Конкурент"', 'Сумма превышает лимит', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2, 4, 2, 2500000, 270, 55547.95, 'Проверяется', 'Не выпущена', 'Не зарегистрирована', 'ООО "Партнер"', 'На проверке', NOW());

-- История операций для тестовых заявок
INSERT INTO history (application_id, stage, comment, ts) VALUES
(1, 'Создание заявки', 'Заявка создана', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(1, 'Проверка возможности выдачи', 'Проверка пройдена, сумма в пределах лимита', DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 1 HOUR),
(1, 'Расчет условий гарантии', 'Комиссия рассчитана: 36 986.30 ₽ (2.5% годовых, минимум 50 000.00 ₽)', DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 2 HOUR),
(1, 'Выпуск банковской гарантии', 'Банковская гарантия выпущена', DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 3 HOUR),
(1, 'Регистрация гарантии', 'Гарантия зарегистрирована в реестре', DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 4 HOUR),
(2, 'Создание заявки', 'Заявка создана', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(2, 'Проверка возможности выдачи', 'Проверка пройдена, сумма в пределах лимита', DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 1 HOUR),
(2, 'Расчет условий гарантии', 'Комиссия рассчитана: 150 000.00 ₽ (3.0% годовых, минимум 75 000.00 ₽)', DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 2 HOUR),
(2, 'Выпуск банковской гарантии', 'Банковская гарантия выпущена', DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 3 HOUR),
(2, 'Регистрация гарантии', 'Гарантия зарегистрирована в реестре', DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 4 HOUR),
(3, 'Создание заявки', 'Заявка создана', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3, 'Проверка возможности выдачи', 'Проверка пройдена, сумма в пределах лимита', DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 1 HOUR),
(3, 'Расчет условий гарантии', 'Комиссия рассчитана: 7 397.26 ₽ (2.0% годовых, минимум 40 000.00 ₽)', DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 2 HOUR),
(3, 'Выпуск банковской гарантии', 'Банковская гарантия выпущена', DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 3 HOUR),
(4, 'Создание заявки', 'Заявка создана', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(4, 'Проверка возможности выдачи', 'Сумма превышает лимит в 5 000 000 ₽', DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 1 HOUR),
(5, 'Создание заявки', 'Заявка создана', NOW());

-- Документы для зарегистрированных заявок
INSERT INTO documents (application_id, doc_type, created_at) VALUES
(1, 'guarantee', DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 4 HOUR),
(1, 'contract', DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 4 HOUR),
(2, 'guarantee', DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 4 HOUR),
(2, 'contract', DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 4 HOUR);
