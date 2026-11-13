// Empaqueta el servidor (Express + dependencias) en un solo archivo para Vercel:
//   frontend/api/index.js  →  Vercel lo publica como función en /api
// Uso (desde backend):  npm run build:vercel
// Vuelve a ejecutarlo cada vez que cambies algo en backend/src y súbelo junto con tus cambios.
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
await build({
  entryPoints: [path.join(here, '../src/vercel.ts')],
  outfile: path.join(here, '../../frontend/api/index.js'),
  bundle: true,
  platform: 'node',
  target: 'node22',
  // frontend/package.json usa "type": "module": la función se publica como ESM.
  format: 'esm',
  external: ['pg-native'],
  legalComments: 'none',
  banner: { js: "// Archivo generado por backend/scripts/buildVercel.mjs. No editar a mano.\nimport { createRequire as __xsgCreateRequire } from 'node:module';\nimport { fileURLToPath as __xsgFileURLToPath } from 'node:url';\nimport __xsgPath from 'node:path';\nconst require = __xsgCreateRequire(import.meta.url);\nconst __filename = __xsgFileURLToPath(import.meta.url);\nconst __dirname = __xsgPath.dirname(__filename);" },
});
console.log('Listo: frontend/api/index.js');
