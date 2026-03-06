import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function addTestData() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "bank_guarantee",
    waitForConnections: true,
    connectionLimit: 10,
  });

  try {
    console.log("Добавление тестовых данных...");

    // Проверяем, есть ли уже заявки
    const [existing] = await pool.query("SELECT COUNT(*) as count FROM applications");
    if (existing[0].count > 0) {
      console.log(`Найдено ${existing[0].count} заявок. Пропускаю добавление данных.`);
      await pool.end();
      return;
    }

    // Добавляем тестовые заявки
    const applications = [
      {
        client_id: 1,
        manager_id: 1,
        guarantee_type_id: 1,
        amount: 3000000,
        term_days: 180,
        commission: 36986.30,
        check_status: 'Одобрено',
        issue_status: 'Выпущена',
        registration_status: 'Зарегистрирована',
        beneficiary: 'ООО "Заказчик"',
        comment: 'Гарантия для участия в тендере',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        client_id: 2,
        manager_id: 1,
        guarantee_type_id: 2,
        amount: 5000000,
        term_days: 365,
        commission: 150000.00,
        check_status: 'Одобрено',
        issue_status: 'Выпущена',
        registration_status: 'Зарегистрирована',
        beneficiary: 'АО "Подрядчик"',
        comment: 'Гарантия исполнения обязательств',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        client_id: 3,
        manager_id: 4,
        guarantee_type_id: 3,
        amount: 1500000,
        term_days: 90,
        commission: 7397.26,
        check_status: 'Одобрено',
        issue_status: 'Выпущена',
        registration_status: 'Не зарегистрирована',
        beneficiary: 'ИП Смирнов',
        comment: 'Гарантия возврата аванса',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        client_id: 1,
        manager_id: 1,
        guarantee_type_id: 1,
        amount: 8000000,
        term_days: 180,
        commission: 0,
        check_status: 'Отказ',
        issue_status: 'Не выпущена',
        registration_status: 'Не зарегистрирована',
        beneficiary: 'ООО "Конкурент"',
        comment: 'Сумма превышает лимит',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        client_id: 2,
        manager_id: 4,
        guarantee_type_id: 2,
        amount: 2500000,
        term_days: 270,
        commission: 0,
        check_status: 'Проверяется',
        issue_status: 'Не выпущена',
        registration_status: 'Не зарегистрирована',
        beneficiary: 'ООО "Партнер"',
        comment: 'На проверке',
        created_at: new Date()
      }
    ];

    for (const app of applications) {
      const [result] = await pool.query(
        `INSERT INTO applications (client_id, manager_id, guarantee_type_id, amount, term_days, commission, check_status, issue_status, registration_status, beneficiary, comment, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [app.client_id, app.manager_id, app.guarantee_type_id, app.amount, app.term_days, app.commission, 
         app.check_status, app.issue_status, app.registration_status, app.beneficiary, app.comment, app.created_at]
      );
      
      const appId = result.insertId;
      console.log(`✓ Добавлена заявка #${appId}`);

      // Добавляем историю для каждой заявки
      const histories = [];
      if (app.check_status === 'Одобрено') {
        histories.push({ stage: 'Создание заявки', comment: 'Заявка создана' });
        histories.push({ stage: 'Проверка возможности выдачи', comment: 'Проверка пройдена, сумма в пределах лимита' });
        if (app.commission > 0) {
          histories.push({ stage: 'Расчет условий гарантии', comment: `Комиссия рассчитана: ${app.commission.toLocaleString('ru-RU', {minimumFractionDigits: 2})} ₽` });
        }
        if (app.issue_status === 'Выпущена') {
          histories.push({ stage: 'Выпуск банковской гарантии', comment: 'Банковская гарантия выпущена' });
        }
        if (app.registration_status === 'Зарегистрирована') {
          histories.push({ stage: 'Регистрация гарантии', comment: 'Гарантия зарегистрирована в реестре' });
        }
      } else if (app.check_status === 'Отказ') {
        histories.push({ stage: 'Создание заявки', comment: 'Заявка создана' });
        histories.push({ stage: 'Проверка возможности выдачи', comment: 'Сумма превышает лимит в 5 000 000 ₽' });
      } else {
        histories.push({ stage: 'Создание заявки', comment: 'Заявка создана' });
      }

      for (const hist of histories) {
        await pool.query(
          `INSERT INTO history (application_id, stage, comment, ts) VALUES (?, ?, ?, ?)`,
          [appId, hist.stage, hist.comment, app.created_at]
        );
      }

      // Добавляем документы для зарегистрированных заявок
      if (app.registration_status === 'Зарегистрирована') {
        await pool.query(
          `INSERT INTO documents (application_id, doc_type, created_at) VALUES (?, 'guarantee', ?)`,
          [appId, app.created_at]
        );
        await pool.query(
          `INSERT INTO documents (application_id, doc_type, created_at) VALUES (?, 'contract', ?)`,
          [appId, app.created_at]
        );
      }
    }

    console.log("✅ Тестовые данные добавлены успешно!");
    await pool.end();
  } catch (error) {
    console.error("❌ Ошибка при добавлении данных:", error.message);
    await pool.end();
    process.exit(1);
  }
}

addTestData();
