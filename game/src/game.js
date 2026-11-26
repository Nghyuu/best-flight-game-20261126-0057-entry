// Game: the state machine that ties the modules together.
// States: title → flying → (paused) → ended. The update loop runs
// in every state — the title screen is alive behind its card, and
// the world keeps scrolling while paused only when the pilot asks.

import { VIEW, MISSIONS } from './config.js';
import { buildTerrain } from './terrain.js';
import { createPlane, stepPlane } from './plane.js';
import { createMission, updateMission, dropCargo, autopilot } from './missions.js';
import { createCamera, updateCamera, renderWorld } from './render.js';
import { drawHud, drawTitle, drawPaused, drawEnd } from './hud.js';
import { createInput } from './input.js';
import { createSound } from './audio.js';

export function createGame(canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  const seed = opts.seed ?? 20261126;
  const terrain = buildTerrain(seed);
  const input = createInput(canvas);
  const sfx = createSound();
  const cam = createCamera();

  const game = {
    state: 'title', // 'title' | 'flying' | 'paused' | 'ended'
    selected: 0,
    terrain,
    plane: createPlane(),
    mission: createMission('rings', terrain),
    cam,
    time: 0,
    autopilot: false,
    muted: false,
  };

  function startMission(index) {
    const def = MISSIONS[index % MISSIONS.length];
    game.plane = createPlane();
    game.mission = createMission(def.id, terrain);
    game.cam.x = 0;
    game.cam.y = -40;
    game.state = 'flying';
    game.time = 0;
    if (!game.autopilot) sfx.unlock();
  }

  function endSortie() {
    game.state = 'ended';
    sfx.engine(0, false);
  }

  // One fixed step of simulation; dt in seconds.
  function step(dt) {
    game.time += dt;
    if (game.state === 'title') {
      // The title screen flies itself: a gentle demo cruise so the
      // world behind the card is alive.
      const demo = game.plane;
      demo.throttle = 0.55;
      demo.pitch = Math.sin(game.time * 0.25) * 6;
      stepPlane(demo, { pitch: 0, throttle: 0, action: false }, dt, terrain.heightAt(demo.x));
      if (demo.x > 6400 || demo.crashed || demo.landed) {
        game.plane = createPlane();
      }
      updateCamera(cam, demo);
      return;
    }
    if (game.state !== 'flying') return;

    const edges = input.consumeEdges();
    let ctrl = input.poll();
    if (game.autopilot) ctrl = autopilot(game.mission, game.plane, terrain);
    if (edges.action) {
      sfx.unlock();
      if (game.mission.kind === 'cargo') dropCargo(game.mission, game.plane);
    }
    if (edges.paused) {
      game.state = 'paused';
      sfx.engine(0, false);
      return;
    }
    if (edges.restart) {
      startMission(game.selected);
      return;
    }
    if (edges.mute) {
      game.muted = sfx.toggleMute();
    }

    const events = stepPlane(game.plane, ctrl, dt, terrain.heightAt(game.plane.x));
    updateMission(game.mission, game.plane, terrain, events, game.time, sfx, dt);
    sfx.engine(game.plane.throttle, true);
    updateCamera(cam, game.plane);
    if (game.mission.done) endSortie();
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - (game._last ?? now)) / 1000 || 0.016);
    game._last = now;
    step(dt);

    ctx.clearRect(0, 0, VIEW.width, VIEW.height);
    renderWorld(ctx, game, game.time);
    if (game.state === 'title') {
      drawTitle(ctx, game.selected);
    } else if (game.state === 'paused') {
      drawHud(ctx, game);
      drawPaused(ctx);
    } else if (game.state === 'ended') {
      drawHud(ctx, game);
      drawEnd(ctx, game);
    } else {
      drawHud(ctx, game);
    }
  }

  // Title-screen keys are handled here so the loop can stay simple.
  function titleKeys() {
    if (game.state !== 'title') return;
    const edges = input.consumeEdges();
    if (edges.missionKey) {
      game.selected = Number(edges.missionKey) - 1;
      startMission(game.selected);
    } else if (edges.start || edges.action) {
      startMission(game.selected);
    }
  }

  function loop(now) {
    titleKeys();
    if (game.state === 'paused') {
      const edges = input.consumeEdges();
      if (edges.paused) {
        game.state = 'flying';
        sfx.unlock();
      } else if (edges.restart) {
        startMission(game.selected);
      }
    }
    if (game.state === 'ended') {
      const edges = input.consumeEdges();
      if (edges.restart) startMission(game.selected);
      else if (edges.mute) game.muted = sfx.toggleMute();
      else if (edges.start || edges.action) {
        game.state = 'title';
        game.plane = createPlane();
        game.mission = createMission('rings', terrain);
      }
    }
    frame(now);
    requestAnimationFrame(loop);
  }

  // Screenshot staging: put the game into a good visual state on
  // load, then pre-fly it so the first painted frame is mid-action.
  function stageShot(shot) {
    if (shot === 2) {
      game.state = 'title';
      return;
    }
    if (shot === 1) {
      game.autopilot = true;
      startMission(0);
      // Pre-fly ~14 seconds so the plane is among the rings. The
      // autopilot stays on afterwards, so the plane keeps flying
      // itself while the screenshot is taken.
      for (let i = 0; i < 840; i++) step(1 / 60);
      return;
    }
    if (shot === 3) {
      game.autopilot = true;
      startMission(1);
      // Pre-fly ~40 seconds of valley cruise, then place the plane
      // on final approach and fly the last 10 seconds in, so the
      // strip at Pinefield is ahead and the plane is descending.
      for (let i = 0; i < 2400; i++) step(1 / 60);
      game.plane.x = 4200;
      game.plane.alt = 110;
      game.plane.vy = -1;
      game.plane.speed = 50;
      game.plane.pitch = -2;
      for (let i = 0; i < 700; i++) step(1 / 60);
      return;
    }
    if (shot === 4) {
      game.autopilot = true;
      startMission(0);
      for (let i = 0; i < 840; i++) step(1 / 60);
      // Finish the Ring Run by hand: mark every ring threaded.
      for (const ring of terrain.rings) ring.passed = true;
      game.mission.ringsHit = terrain.rings.length;
      game.mission.score = 1500;
      game.mission.done = true;
      game.mission.doneReason = 'All 6 rings threaded — clean run!';
      game.state = 'ended';
      return;
    }
    game.state = 'title';
  }

  return {
    game,
    startMission,
    stageShot,
    loop,
    step,
    frame,
  };
}
