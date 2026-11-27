// Gobble Dash — the entry program (Node 22, standard library only). It hands the
// game in: copy this repository's game/ and screenshots/ into /output and write
// /output/dossier.json, the summary the judge reads, using the vendored make.fun
// library. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// List every file under a directory, paths relative to it, sorted.
function listFiles(dir: string, base = dir): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...listFiles(full, base));
    else if (entry.isFile()) found.push(full.slice(base.length + 1));
  }
  return found.sort();
}

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

// Second-pass check of the sources before anything is copied: every file
// must exist and be non-empty, index.html must reference the game modules
// it ships with, and every screenshot must be a real JPEG (magic bytes).
function validateSources(): { gameFiles: string[]; shotFiles: string[] } {
  const gameDir = join(here, 'game');
  const indexPath = join(gameDir, 'index.html');
  if (!existsSync(indexPath)) throw new Error('missing game/index.html');
  const gameFiles = listFiles(gameDir);
  if (gameFiles.length === 0) throw new Error('game/ is empty');
  for (const rel of gameFiles) {
    const bytes = readFileSync(join(gameDir, rel));
    if (bytes.length === 0) throw new Error(`empty game file: ${rel}`);
  }
  const index = readFileSync(indexPath, 'utf8');
  if (!index.includes('src/main.js')) throw new Error('game/index.html does not reference src/main.js');
  // Every module under game/src must be reachable: imported by index.html
  // or by another module, so no dead or orphaned file ships by accident.
  const srcFiles = gameFiles.filter((f) => f.startsWith('src/'));
  const importers = [index, ...srcFiles.map((f) => readFileSync(join(gameDir, f), 'utf8'))];
  for (const mod of srcFiles) {
    const base = mod.slice('src/'.length);
    if (mod !== 'src/main.js' && !importers.some((text) => text.includes(`./${base}`))) {
      throw new Error(`game module is not imported by anything: ${mod}`);
    }
  }
  const shotDir = join(here, 'screenshots');
  const shotFiles = existsSync(shotDir) ? listFiles(shotDir) : [];
  if (shotFiles.length === 0) throw new Error('screenshots/ is empty');
  if (shotFiles.length > 4) throw new Error(`too many screenshots: ${shotFiles.length}`);
  for (const rel of shotFiles) {
    const bytes = readFileSync(join(shotDir, rel));
    if (bytes.length === 0) throw new Error(`empty screenshot: ${rel}`);
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
      throw new Error(`screenshot is not a JPEG: ${rel}`);
    }
  }
  return { gameFiles, shotFiles };
}

const { gameFiles, shotFiles } = validateSources();

// Deterministic content record: sha256 of every file handed in, so the
// read-back step can prove the copies are byte-identical to the sources.
const manifest: Array<[string, string]> = [
  ...gameFiles.map((f) => [`game/${f}`, sha256(readFileSync(join(here, 'game', f)))] as [string, string]),
  ...shotFiles.map((f) => [`screenshots/${f}`, sha256(readFileSync(join(here, 'screenshots', f)))] as [string, string]),
];

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps: only text_max_bytes shapes the bytes; the others refuse an
// entry the scorer would refuse (more than 4 screenshots or one over 256 KiB; more
// than 993 files in game/ or 48 MiB of game files in all, or a path under game/
// over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

// Read back and verify: dossier.json must parse, and every file copied to
// /output must be byte-identical to its source.
const dossierBytes = readFileSync(join(out, 'dossier.json'));
const dossier = JSON.parse(dossierBytes.toString('utf8'));
if (typeof dossier !== 'object' || dossier === null) {
  throw new Error('dossier.json did not parse to an object');
}
for (const [rel, hash] of manifest) {
  const copied = readFileSync(join(out, rel));
  if (sha256(copied) !== hash) throw new Error(`copied file differs from source: ${rel}`);
}
console.log(`Gobble Dash handed in: ${gameFiles.length} game files, ${shotFiles.length} screenshots, dossier ${dossierBytes.length} bytes`);
