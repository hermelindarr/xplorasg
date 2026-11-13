// Crea un .zip con el CONTENIDO de una carpeta (rutas con "/", incluye dotfiles como .htaccess).
// Sin dependencias: usa zlib de Node. Uso: node zip-dir.mjs <carpeta> <salida.zip>
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import zlib from 'node:zlib';

const [src, out] = process.argv.slice(2);
if (!src || !out) { console.error('Uso: node zip-dir.mjs <carpeta> <salida.zip>'); process.exit(1); }

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = zlib.crc32 ?? ((buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
});

const walk = (dir) => readdirSync(dir, { withFileTypes: true })
  .sort((a, b) => a.name.localeCompare(b.name))
  .flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : e.isFile() ? [join(dir, e.name)] : []));

const dosTime = (d) => ({
  time: (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2),
  date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
});

const parts = [];
const central = [];
let offset = 0;

for (const file of walk(src)) {
  const name = Buffer.from(relative(src, file).split(sep).join('/'), 'utf8');
  const data = readFileSync(file);
  const deflated = zlib.deflateRawSync(data, { level: 9 });
  const stored = deflated.length >= data.length;
  const body = stored ? data : deflated;
  const crc = crc32(data);
  const { time, date } = dosTime(statSync(file).mtime);

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6);
  local.writeUInt16LE(stored ? 0 : 8, 8); local.writeUInt16LE(time, 10); local.writeUInt16LE(date, 12);
  local.writeUInt32LE(crc, 14); local.writeUInt32LE(body.length, 18); local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(name.length, 26); local.writeUInt16LE(0, 28);
  parts.push(local, name, body);

  const cd = Buffer.alloc(46);
  cd.writeUInt32LE(0x02014b50, 0); cd.writeUInt16LE(0x031e, 4); cd.writeUInt16LE(20, 6); cd.writeUInt16LE(0x0800, 8);
  cd.writeUInt16LE(stored ? 0 : 8, 10); cd.writeUInt16LE(time, 12); cd.writeUInt16LE(date, 14);
  cd.writeUInt32LE(crc, 16); cd.writeUInt32LE(body.length, 20); cd.writeUInt32LE(data.length, 24);
  cd.writeUInt16LE(name.length, 28); cd.writeUInt32LE((0o100644 << 16) >>> 0, 38); cd.writeUInt32LE(offset, 42);
  central.push(cd, name);
  offset += local.length + name.length + body.length;
}

const cdBuf = Buffer.concat(central);
const end = Buffer.alloc(22);
const count = central.length / 2;
end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(count, 8); end.writeUInt16LE(count, 10);
end.writeUInt32LE(cdBuf.length, 12); end.writeUInt32LE(offset, 16);
writeFileSync(out, Buffer.concat([...parts, cdBuf, end]));
console.log(`${out}: ${count} archivos, ${(offset / 1024).toFixed(0)} KB`);
