import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use((_req, res, next) => {
  const origJson = res.json.bind(res);
  res.json = (body) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return origJson(body);
  };
  next();
});

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
  charset: "utf8mb4",
});

app.get("/api/bootstrap", async (_req, res) => {
  const conn = await pool.getConnection();
  try {
    const [clients] = await conn.query("SELECT * FROM clients");
    const [staff] = await conn.query("SELECT * FROM staff");
    const [guaranteeTypes] = await conn.query("SELECT * FROM guarantee_types");
    const [tariffs] = await conn.query("SELECT * FROM tariffs");
    const [applications] = await conn.query("SELECT * FROM applications ORDER BY id");
    const [history] = await conn.query("SELECT * FROM history ORDER BY ts DESC");
    const [documents] = await conn.query("SELECT * FROM documents ORDER BY created_at DESC");
    res.json({ clients, staff, guaranteeTypes, tariffs, applications, history, documents });
  } finally {
    conn.release();
  }
});

app.post("/api/clients", async (req, res) => {
  const { name, inn, contact } = req.body;
  const [result] = await pool.query("INSERT INTO clients (name, inn, contact) VALUES (?, ?, ?)", [name, inn || null, contact || null]);
  res.json({ id: result.insertId, name, inn, contact });
});

app.post("/api/applications", async (req, res) => {
  const { client_id, manager_id, guarantee_type_id, amount, term_days, beneficiary, comment } = req.body;
  const check_status = "Новая";
  const issue_status = "Не выпущена";
  const registration_status = "Не зарегистрирована";
  const [result] = await pool.query(
    "INSERT INTO applications (client_id, manager_id, guarantee_type_id, amount, term_days, check_status, issue_status, registration_status, beneficiary, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [client_id, manager_id, guarantee_type_id, amount, term_days, check_status, issue_status, registration_status, beneficiary || null, comment || ""]
  );
  const id = result.insertId;
  await pool.query("INSERT INTO history (application_id, stage, comment) VALUES (?, ?, ?)", [id, "Создание заявки", "Заявка создана"]);
  const [rows] = await pool.query("SELECT * FROM applications WHERE id = ?", [id]);
  res.json(rows[0]);
});

app.patch("/api/applications/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const setParts = [];
  const values = [];
  
  if (updates.check_status !== undefined) {
    setParts.push("check_status=?");
    values.push(updates.check_status);
  }
  if (updates.issue_status !== undefined) {
    setParts.push("issue_status=?");
    values.push(updates.issue_status);
  }
  if (updates.registration_status !== undefined) {
    setParts.push("registration_status=?");
    values.push(updates.registration_status);
  }
  if (updates.commission !== undefined) {
    setParts.push("commission=?");
    values.push(updates.commission);
  }
  if (updates.comment !== undefined) {
    setParts.push("comment=?");
    values.push(updates.comment);
  }
  
  if (setParts.length === 0) {
    return res.status(400).json({ error: "no_updates" });
  }
  
  values.push(id);
  await pool.query(`UPDATE applications SET ${setParts.join(", ")} WHERE id=?`, values);
  
  const stage = updates.stage || "Обновление";
  const comment = updates.history_comment || updates.comment || "";
  await pool.query("INSERT INTO history (application_id, stage, comment) VALUES (?, ?, ?)", [id, stage, comment]);
  
  const [rows] = await pool.query("SELECT * FROM applications WHERE id = ?", [id]);
  res.json(rows[0]);
});

app.get("/api/history", async (req, res) => {
  const { applicationId } = req.query;
  let rows;
  if (applicationId) {
    [rows] = await pool.query("SELECT * FROM history WHERE application_id=? ORDER BY ts DESC", [applicationId]);
  } else {
    [rows] = await pool.query("SELECT * FROM history ORDER BY ts DESC");
  }
  res.json(rows);
});

app.get("/api/documents", async (req, res) => {
  const { application_id } = req.query;
  let rows;
  if (application_id) {
    [rows] = await pool.query("SELECT * FROM documents WHERE application_id=? ORDER BY created_at DESC", [application_id]);
  } else {
    [rows] = await pool.query("SELECT * FROM documents ORDER BY created_at DESC");
  }
  res.json(rows);
});

app.post("/api/documents", async (req, res) => {
  const { application_id, doc_type } = req.body;
  const [result] = await pool.query("INSERT INTO documents (application_id, doc_type) VALUES (?, ?)", [application_id, doc_type]);
  res.json({ id: result.insertId, application_id, doc_type });
});

app.use(express.static(path.join(__dirname, "public")));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API listening on ${port}`));
