const express = require("express");
const cors = require("cors");
const { port, corsOrigin, nodeEnv } = require("./config/env");
const { checkConnection } = require("./config/db");
const { manejadorNotFound, manejadorErrores } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const lugarRoutes = require("./routes/lugarRoutes");
const catalogoRoutes = require("./routes/catalogoRoutes");
const exploracionRoutes = require("./routes/exploracionRoutes");
const reservaRoutes = require("./routes/reservaRoutes");
const opinionRoutes = require("./routes/opinionRoutes");
const rutaRoutes = require("./routes/rutaRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ estado: "ok", proyecto: "XploraSG API", entorno: nodeEnv });
});

// Todas las rutas de negocio se montan bajo /api
app.use("/api", authRoutes);
app.use("/api", lugarRoutes);
app.use("/api", catalogoRoutes);
app.use("/api", exploracionRoutes);
app.use("/api", reservaRoutes);
app.use("/api", opinionRoutes);
app.use("/api", rutaRoutes);
app.use("/api", adminRoutes);

app.use(manejadorNotFound);
app.use(manejadorErrores);

async function start() {
  await checkConnection();
  app.listen(port, () => {
    console.log(`XploraSG API escuchando en http://localhost:${port}`);
  });
}

start();
