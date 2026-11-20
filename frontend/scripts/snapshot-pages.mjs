// Guarda el HTML renderizado de varias páginas (con su CSS en línea) para auditarlas sin navegador,
// por ejemplo con `impeccable detect <carpeta>`. Uso:
//   node scripts/snapshot-pages.mjs http://localhost:5180 <carpeta-de-salida> [ancho]x[alto]
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [base = 'http://localhost:5180', out = 'snapshots', size = '1280x800'] = process.argv.slice(2);
const [width, height] = size.split('x').map(Number);
const routes = ['/', '/explorar', '/lugares/canon-del-paraiso', '/servicios', '/mapa', '/agenda', '/asistente', '/encuesta', '/favoritos', '/nosotros'];

mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height }, locale: 'es-MX' });
for (const route of routes) {
  await page.goto(base + route, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const html = await page.evaluate(() => {
    const css = [...document.styleSheets].map((sheet) => {
      try { return [...sheet.cssRules].map((rule) => rule.cssText).join('\n'); } catch { return ''; }
    }).join('\n');
    const clone = document.documentElement.cloneNode(true);
    clone.querySelectorAll('script, link[rel="stylesheet"], style').forEach((node) => node.remove());
    const style = document.createElement('style');
    style.textContent = css;
    clone.querySelector('head').appendChild(style);
    return '<!doctype html>\n' + clone.outerHTML;
  });
  const name = route === '/' ? 'inicio' : route.slice(1).replaceAll('/', '_');
  writeFileSync(join(out, `${name}.html`), html);
  console.log('ok', route);
}
await browser.close();
