require("dotenv").config();

// Punto único para leer variables de entorno, con validación temprana.
// Evita que credenciales o valores por defecto queden dispersos en el código.
const required = ["DB_HOST", "DB_USER", "DB_NAME", "JWT_SECRET"];

for (const key of required) {
  if (!process.env[key]) {
    console.warn(`⚠️  Falta la variable de entorno ${key}. Revisa tu archivo .env`);
  }
}

module.exports = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
};
