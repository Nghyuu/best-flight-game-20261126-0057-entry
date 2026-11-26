// Valley Run — entry point. Sizes the canvas, builds the game,
// stages a screenshot state when ?shot= is given, and starts the
// loop. Any uncaught error is written into #errlog so a headless
// run can prove the page loaded cleanly.

import { VIEW } from './config.js';
import { createGame } from './game.js';

const errlog = document.getElementById('errlog');
window.addEventListener('error', (e) => {
  if (errlog) errlog.textContent += `${e.message} @ ${e.filename}:${e.lineno}; `;
});
window.addEventListener('unhandledrejection', (e) => {
  if (errlog) errlog.textContent += `rejection: ${e.reason}; `;
});

const canvas = document.getElementById('game');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') ?? 20261126) || 20261126;
const shot = Number(params.get('shot') ?? 0) || 0;

const { stageShot, loop, game } = createGame(canvas, { seed });
// A read-only handle for automated play-tests (key dispatch checks).
window.__valley = game;
if (shot >= 1 && shot <= 4) stageShot(shot);

requestAnimationFrame(loop);
