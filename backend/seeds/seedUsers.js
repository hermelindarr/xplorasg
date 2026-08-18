/**
 * Crea los usuarios de prueba (administrador, prestador, turista) con
 * contraseñas hasheadas correctamente con bcrypt.
 *
 * Uso:
 *   cd backend
 *   npm run seed:users
 *
 * Requiere que 01_schema.sql y 02_seed_data.sql ya se hayan ejecutado
 * (roles y municipios/categorías deben existir).
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");

const USUARIOS_DEMO = [
  {
    nombre: "Admin XploraSG",
    correo: "xplora.sg8@gmail.com",
    passwordEnv: "SEED_ADMIN_PASSWORD",
    rol: "administrador",
  },
  {
    nombre: "Prestador Demo",
    correo: "prestador.demo@xplorasg.mx",
    passwordEnv: "SEED_PRESTADOR_PASSWORD",
    rol: "prestador",
  },
  {
    nombre: "Turista Demo",
    correo: "turista.demo@xplorasg.mx",
    passwordEnv: "SEED_TURISTA_PASSWORD",
    rol: "turista",
  },
];

async function seed() {
  for (const u of USUARIOS_DEMO) {
    const password = process.env[u.passwordEnv];
    if (!password) {
      console.warn(`⚠️  Falta ${u.passwordEnv} en .env — se omite ${u.correo}`);
      continue;
    }

    const [rolRows] = await pool.query("SELECT id_rol FROM roles WHERE nombre_rol = ?", [u.rol]);
    if (!rolRows[0]) {
      console.warn(`⚠️  Rol "${u.rol}" no existe todavía. Ejecuta primero 01_schema.sql y 02_seed_data.sql`);
      continue;
    }

    const [existe] = await pool.query("SELECT id_usuario FROM usuarios WHERE correo = ?", [u.correo]);
    if (existe[0]) {
      console.log(`ℹ️  ${u.correo} ya existe, se omite.`);
      continue;
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO usuarios (nombre, correo, contrasena_hash, id_rol) VALUES (?, ?, ?, ?)",
      [u.nombre, u.correo, hash, rolRows[0].id_rol]
    );
    console.log(`✅ Usuario creado: ${u.correo} (rol: ${u.rol})`);
  }

  console.log("\nUsuarios de prueba listos. Credenciales definidas en tu archivo .env:");
  console.log("  Administrador → xplora.sg8@gmail.com / valor de SEED_ADMIN_PASSWORD");
  console.log("  Prestador     → prestador.demo@xplorasg.mx / valor de SEED_PRESTADOR_PASSWORD");
  console.log("  Turista       → turista.demo@xplorasg.mx / valor de SEED_TURISTA_PASSWORD");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Error al crear usuarios de prueba:", err);
  process.exit(1);
});
