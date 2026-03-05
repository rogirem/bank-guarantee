import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function setupDatabase() {
  console.log("=== Настройка базы данных ===");
  
  try {
    // Попытка подключения без указания базы данных
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      connectTimeout: 5000,
    });

    console.log("✅ Подключение к MySQL успешно!");

    // Создание базы данных
    const dbName = process.env.DB_NAME || "bank_guarantee";
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ База данных '${dbName}' создана или уже существует`);

    await connection.end();

    // Подключение к конкретной базе данных
    const pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
    });

    // Чтение и выполнение SQL скрипта
    const sqlPath = path.join(__dirname, "schema.sql");
    if (!fs.existsSync(sqlPath)) {
      console.error(`❌ Файл schema.sql не найден: ${sqlPath}`);
      await pool.end();
      return false;
    }

    const sqlScript = fs.readFileSync(sqlPath, "utf8");
    
    // Разделение на отдельные запросы
    const queries = sqlScript
      .split(";")
      .map((q) => q.trim())
      .filter((q) => q.length > 0 && !q.startsWith("--") && !q.startsWith("/*"));

    console.log(`Выполнение ${queries.length} SQL запросов...`);
    
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      if (query.length === 0) continue;
      
      try {
        await pool.query(query);
        if (i < 10 || i % 10 === 0) {
          console.log(`  ✓ Запрос ${i + 1}/${queries.length}`);
        }
      } catch (err) {
        // Игнорируем ошибки "already exists"
        if (!err.message.includes("already exists") && !err.message.includes("Duplicate")) {
          console.warn(`  ⚠ Ошибка в запросе ${i + 1}: ${err.message}`);
        }
      }
    }

    console.log("✅ SQL скрипт выполнен успешно!");
    await pool.end();
    
    console.log("\n=== База данных готова к использованию ===");
    return true;
    
  } catch (error) {
    console.error("\n❌ Ошибка настройки базы данных:");
    console.error(`   ${error.message}`);
    
    if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
      console.error("\n💡 MySQL сервер не запущен или недоступен.");
      console.error("   Попробуйте:");
      console.error("   1. Запустить MySQL через службы Windows");
      console.error("   2. Или запустить XAMPP/WAMP и запустить MySQL");
      console.error("   3. Или запустить mysqld вручную:");
      console.error(`      cd "C:\\Program Files\\MariaDB 12.1\\bin"`);
      console.error(`      mysqld.exe --datadir="C:\\Program Files\\MariaDB 12.1\\data"`);
    } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.error("\n💡 Ошибка доступа. Проверьте настройки в .env файле:");
      console.error(`   DB_USER=${process.env.DB_USER || "root"}`);
      console.error(`   DB_PASSWORD=${process.env.DB_PASSWORD ? "***" : "(пусто)"}`);
    }
    
    return false;
  }
}

setupDatabase().then((success) => {
  process.exit(success ? 0 : 1);
});
