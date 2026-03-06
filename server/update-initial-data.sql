-- Переписать начальные данные правильным русским текстом (кодировка UTF-8).
-- Выполнить на ноде, где крутится контейнер БД:
--   sudo docker exec -i $(sudo docker ps -q -f name=bank-guarantee_db) mysql -uroot -prootpass bank_guarantee < server/update-initial-data.sql

SET NAMES 'utf8mb4';

-- Клиенты (id 1-3)
UPDATE clients SET name = 'ООО "СтройКомплекс"', inn = '7701234567', contact = 'info@stroykom.ru, +7 (495) 123-45-67' WHERE id = 1;
UPDATE clients SET name = 'ИП Иванов Иван Иванович', inn = '7708765432', contact = 'ivanov@mail.ru, +7 (495) 987-65-43' WHERE id = 2;
UPDATE clients SET name = 'ООО "Торговый Дом"', inn = '7701112233', contact = 'td@trade.ru, +7 (812) 111-22-33' WHERE id = 3;

-- Сотрудники (id 1-4)
UPDATE staff SET name = 'Петров Петр Петрович', role = 'Менеджер' WHERE id = 1;
UPDATE staff SET name = 'Сидорова Анна Сергеевна', role = 'Риск-аналитик' WHERE id = 2;
UPDATE staff SET name = 'Козлов Дмитрий Владимирович', role = 'Юрист' WHERE id = 3;
UPDATE staff SET name = 'Смирнова Елена Александровна', role = 'Менеджер' WHERE id = 4;

-- Типы гарантий (id 1-3)
UPDATE guarantee_types SET name = 'Тендерная' WHERE id = 1;
UPDATE guarantee_types SET name = 'Исполнения обязательств' WHERE id = 2;
UPDATE guarantee_types SET name = 'Возврата аванса' WHERE id = 3;

-- Заявки (id 1-5): статусы и тексты
UPDATE applications SET check_status = 'Одобрено', issue_status = 'Выпущена', registration_status = 'Зарегистрирована', beneficiary = 'ООО "Заказчик"', comment = 'Гарантия для участия в тендере' WHERE id = 1;
UPDATE applications SET check_status = 'Одобрено', issue_status = 'Выпущена', registration_status = 'Зарегистрирована', beneficiary = 'АО "Подрядчик"', comment = 'Гарантия исполнения обязательств' WHERE id = 2;
UPDATE applications SET check_status = 'Одобрено', issue_status = 'Выпущена', registration_status = 'Не зарегистрирована', beneficiary = 'ИП Смирнов', comment = 'Гарантия возврата аванса' WHERE id = 3;
UPDATE applications SET check_status = 'Отказ', issue_status = 'Не выпущена', registration_status = 'Не зарегистрирована', beneficiary = 'ООО "Конкурент"', comment = 'Сумма превышает лимит' WHERE id = 4;
UPDATE applications SET check_status = 'Проверяется', issue_status = 'Не выпущена', registration_status = 'Не зарегистрирована', beneficiary = 'ООО "Партнер"', comment = 'На проверке' WHERE id = 5;

-- История (по id 1-13 в порядке вставки в schema.sql)
UPDATE history SET stage = 'Создание заявки', comment = 'Заявка создана' WHERE id = 1;
UPDATE history SET stage = 'Проверка возможности выдачи', comment = 'Проверка пройдена, сумма в пределах лимита' WHERE id = 2;
UPDATE history SET stage = 'Расчет условий гарантии', comment = 'Комиссия рассчитана: 36 986.30 ₽ (2.5% годовых, минимум 50 000.00 ₽)' WHERE id = 3;
UPDATE history SET stage = 'Выпуск банковской гарантии', comment = 'Банковская гарантия выпущена' WHERE id = 4;
UPDATE history SET stage = 'Регистрация гарантии', comment = 'Гарантия зарегистрирована в реестре' WHERE id = 5;
UPDATE history SET stage = 'Создание заявки', comment = 'Заявка создана' WHERE id = 6;
UPDATE history SET stage = 'Проверка возможности выдачи', comment = 'Проверка пройдена, сумма в пределах лимита' WHERE id = 7;
UPDATE history SET stage = 'Расчет условий гарантии', comment = 'Комиссия рассчитана: 150 000.00 ₽ (3.0% годовых, минимум 75 000.00 ₽)' WHERE id = 8;
UPDATE history SET stage = 'Выпуск банковской гарантии', comment = 'Банковская гарантия выпущена' WHERE id = 9;
UPDATE history SET stage = 'Регистрация гарантии', comment = 'Гарантия зарегистрирована в реестре' WHERE id = 10;
UPDATE history SET stage = 'Создание заявки', comment = 'Заявка создана' WHERE id = 11;
UPDATE history SET stage = 'Проверка возможности выдачи', comment = 'Проверка пройдена, сумма в пределах лимита' WHERE id = 12;
UPDATE history SET stage = 'Расчет условий гарантии', comment = 'Комиссия рассчитана: 7 397.26 ₽ (2.0% годовых, минимум 40 000.00 ₽)' WHERE id = 13;
UPDATE history SET stage = 'Выпуск банковской гарантии', comment = 'Банковская гарантия выпущена' WHERE id = 14;
UPDATE history SET stage = 'Создание заявки', comment = 'Заявка создана' WHERE id = 15;
UPDATE history SET stage = 'Проверка возможности выдачи', comment = 'Сумма превышает лимит в 5 000 000 ₽' WHERE id = 16;
UPDATE history SET stage = 'Создание заявки', comment = 'Заявка создана' WHERE id = 17;
