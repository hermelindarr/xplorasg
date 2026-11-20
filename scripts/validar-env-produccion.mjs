// Valida frontend/.env.production antes de compilar (lo usa Dockerfile.cpanel).
import { existsSync, readFileSync } from 'node:fs';

const archivo = process.argv[2] || '.env.production';
const fallo = (msg) => { console.error(`\n*** ${msg} ***\n`); process.exit(1); };

if (!existsSync(archivo)) fallo('Falta frontend/.env.production: copia frontend/env.production.ejemplo con ese nombre y rellena los valores');
const texto = readFileSync(archivo, 'utf8');
const valor = (k) => (texto.match(new RegExp(`^\\s*${k}\\s*=\\s*(.*?)\\s*$`, 'm')) || [])[1] || '';

const api = valor('VITE_API_URL');
if (!api.startsWith('https://') || /localhost|tudominio/.test(api)) fallo(`VITE_API_URL debe ser la URL https real de la API (valor actual: "${api}")`);
if (api.replace(/\/$/, '').endsWith('/api')) fallo('VITE_API_URL va SIN "/api" al final (la app ya lo agrega)');
if (!valor('VITE_SUPABASE_URL')) fallo('Falta VITE_SUPABASE_URL');
if (!valor('VITE_SUPABASE_PUBLISHABLE_KEY') && !valor('VITE_SUPABASE_ANON_KEY')) fallo('Falta VITE_SUPABASE_PUBLISHABLE_KEY');
if (/service_role|SERVICE_ROLE_KEY|DATABASE_URL|_API_KEY\s*=\s*\S/.test(texto)) fallo('.env.production solo debe llevar variables publicas VITE_*: quita claves secretas');

console.log(`OK  API de produccion: ${api}`);
console.log(`OK  Supabase: ${valor('VITE_SUPABASE_URL')}`);
