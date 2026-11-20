// Punto de entrada para Vercel: la misma app de Express, sin app.listen().
// Se empaqueta en frontend/api/index.js con `npm run build:vercel` (ver backend/scripts/buildVercel.mjs).
import app from './app';

export default app;
