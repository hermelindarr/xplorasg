const mysql = require("mysql2/promise");
require("dotenv").config();

// Pool de conexiones reutilizable para toda la API.
// Evita abrir/cerrar una conexión nueva en cada petición.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true,
  charset: "utf8mb4",
});

async function checkConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log("Conexión a MySQL establecida correctamente.");
  } catch (err) {
    console.error("No se pudo conectar a MySQL:", err.message);
    process.exit(1);
  }
}

module.exports = { pool, checkConnection };
