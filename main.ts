// Valley Run — the hand-in program (Node 22, standard library only).
// It copies the playable game (game/) and the screenshots
// (screenshots/) from beside this file into the output directory and
// writes the dossier the judge reads, built with the kit's vendored
// make.fun library. The output directory comes from
// MAKEFUN_OUTPUT_DIR outside the grader, and defaults to /output
// inside it. Nothing is written anywhere else, and the program
// throws rather than guessing an output directory.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync, chmodSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The scorer's own caps: only text_max_bytes shapes the dossier's
// bytes; the rest refuse an entry the scorer would refuse anyway.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR;
if (!outputDir) {
  throw new Error('MAKEFUN_OUTPUT_DIR is not set: this program writes only to the directory it names');
}

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

writeFileSync(join(outputDir, 'dossier.json'), buildDossier(outputDir, DOSSIER_CAPS));

// The grader collects the output as another user, and this VM's umask
// leaves files at 660: make every output file world-readable.
function makeReadable(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) makeReadable(p);
    else chmodSync(p, 0o644);
  }
}
makeReadable(outputDir);
