// Renderer: the valley in one flat, warm style — sky gradient,
// sun, two ridge layers, patchwork ground, river, town, runway and
// rings — plus the little red prop plane with its spinning prop.
// World metres become screen pixels through the camera; the plane
// sits near the left third and the world scrolls past it.

import { VIEW, WORLD, COLOURS } from './config.js';

export function createCamera() {
  return { x: 0, y: -40 };
}

function screenX(cam, x) {
  return (x - cam.x) * WORLD.pxPerMetre;
}

function screenY(cam, alt) {
  return VIEW.height - 100 - (alt - cam.y) * WORLD.pxPerMetre;
}

export function updateCamera(cam, plane) {
  const wantX = plane.x - 180;
  const wantY = plane.alt - 150;
  cam.x += (wantX - cam.x) * 0.12;
  cam.y += (wantY - cam.y) * 0.08;
  if (cam.x < -60) cam.x = -60;
  if (cam.y < -60) cam.y = -60;
  if (cam.y > 190) cam.y = 190;
}

function drawSky(ctx, cam, time) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  g.addColorStop(0, COLOURS.skyTop);
  g.addColorStop(0.55, COLOURS.skyMid);
  g.addColorStop(1, COLOURS.skyLow);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  // Sun, fixed in the sky, with a soft halo.
  const sx = VIEW.width - 170;
  const sy = 110;
  const halo = ctx.createRadialGradient(sx, sy, 10, sx, sy, 120);
  halo.addColorStop(0, 'rgba(255,215,110,0.85)');
  halo.addColorStop(1, 'rgba(255,215,110,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(sx - 120, sy - 120, 240, 240);
  ctx.fillStyle = COLOURS.sun;
  ctx.beginPath();
  ctx.arc(sx, sy, 42, 0, Math.PI * 2);
  ctx.fill();

  // Far ridge, slow parallax: a thin band of distant hills hugging
  // the horizon, never a wall across the sky.
  ctx.fillStyle = COLOURS.ridgeFar;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  const ridgePts = [];
  for (let px = 0; px <= VIEW.width; px += 16) {
    const wx = cam.x * 0.35 + px / WORLD.pxPerMetre;
    const alt = 118 + 30 * Math.sin(wx * 0.004 + 1.7) + 14 * Math.sin(wx * 0.011);
    ridgePts.push([px, screenY(cam, alt)]);
  }
  ctx.moveTo(ridgePts[0][0], ridgePts[0][1]);
  for (const [px, py] of ridgePts) ctx.lineTo(px, py);
  for (let i = ridgePts.length - 1; i >= 0; i--) ctx.lineTo(ridgePts[i][0], ridgePts[i][1] + 90);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawClouds(ctx, terrain, cam, time) {
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  for (const c of terrain.clouds) {
    const cx = screenX(cam, c.x + time * c.speed * 0.4);
    const cy = screenY(cam, c.alt);
    if (cx < -160 || cx > VIEW.width + 160) continue;
    const s = c.scale;
    for (const [ox, oy, rx, ry] of [[0, 0, 52, 16], [-34, 6, 30, 12], [36, 6, 32, 13]]) {
      ctx.beginPath();
      ctx.ellipse(cx + ox * s, cy + oy * s, rx * s, ry * s, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawGround(ctx, terrain, cam) {
  const step = 8;
  const x0 = Math.max(0, cam.x - 20);
  const x1 = cam.x + VIEW.width / WORLD.pxPerMetre + 40;

  // Fields first, as flat coloured bands hugging the terrain.
  for (const f of terrain.fields) {
    if (f.x1 < x0 || f.x0 > x1) continue;
    ctx.fillStyle = f.colour;
    ctx.beginPath();
    ctx.moveTo(screenX(cam, f.x0), screenY(cam, terrain.heightAt(f.x0)));
    for (let x = f.x0; x <= f.x1; x += step) ctx.lineTo(screenX(cam, x), screenY(cam, terrain.heightAt(x)));
    ctx.lineTo(screenX(cam, f.x1), VIEW.height);
    ctx.lineTo(screenX(cam, f.x0), VIEW.height);
    ctx.closePath();
    ctx.fill();
  }

  // The ground itself.
  ctx.fillStyle = COLOURS.grass;
  ctx.beginPath();
  ctx.moveTo(screenX(cam, x0), screenY(cam, terrain.heightAt(x0)));
  for (let x = x0; x <= x1; x += step) ctx.lineTo(screenX(cam, x), screenY(cam, terrain.heightAt(x)));
  ctx.lineTo(screenX(cam, x1), VIEW.height);
  ctx.lineTo(screenX(cam, x0), VIEW.height);
  ctx.closePath();
  ctx.fill();

  // A darker grass fringe along the crest so the hill line reads.
  ctx.strokeStyle = COLOURS.grassDark;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(screenX(cam, x0), screenY(cam, terrain.heightAt(x0)));
  for (let x = x0; x <= x1; x += step) ctx.lineTo(screenX(cam, x), screenY(cam, terrain.heightAt(x)));
  ctx.stroke();

  // The river: a blue ribbon where the channel cuts the ground.
  const rx = terrain.riverX;
  if (rx > x0 - 200 && rx < x1 + 200) {
    ctx.fillStyle = COLOURS.river;
    ctx.beginPath();
    ctx.moveTo(screenX(cam, rx - 90), screenY(cam, terrain.heightAt(rx - 90)));
    for (let x = rx - 90; x <= rx + 90; x += 8) ctx.lineTo(screenX(cam, x), screenY(cam, terrain.heightAt(x)));
    ctx.lineTo(screenX(cam, rx + 90), screenY(cam, terrain.heightAt(rx + 90)) + 26);
    ctx.lineTo(screenX(cam, rx - 90), screenY(cam, terrain.heightAt(rx - 90)) + 26);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(screenX(cam, rx - 70), screenY(cam, terrain.heightAt(rx - 70)) + 12);
    ctx.lineTo(screenX(cam, rx + 70), screenY(cam, terrain.heightAt(rx + 70)) + 12);
    ctx.stroke();
  }
}

function drawTown(ctx, terrain, cam) {
  for (const h of terrain.houses) {
    const gx = screenX(cam, h.x);
    if (gx < -60 || gx > VIEW.width + 60) continue;
    const gy = screenY(cam, terrain.heightAt(h.x));
    const w = h.w;
    const hh = h.h;
    ctx.fillStyle = h.wall;
    ctx.fillRect(gx, gy - hh, w, hh);
    ctx.fillStyle = h.roof;
    ctx.beginPath();
    ctx.moveTo(gx - 3, gy - hh);
    ctx.lineTo(gx + w / 2, gy - hh - 11);
    ctx.lineTo(gx + w + 3, gy - hh);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2e4a6b';
    ctx.fillRect(gx + w * 0.28, gy - hh + 6, 5, 6);
    ctx.fillRect(gx + w * 0.62, gy - hh + 6, 5, 6);
  }
}

function drawRunway(ctx, terrain, cam, time) {
  const r = terrain.runway;
  const x0 = screenX(cam, r.x0);
  const x1 = screenX(cam, r.x1);
  const y = screenY(cam, r.alt);
  if (x1 < -40 || x0 > VIEW.width + 40) return;
  ctx.fillStyle = COLOURS.runway;
  ctx.fillRect(x0, y - 4, x1 - x0, 10);
  ctx.fillStyle = COLOURS.runwayMark;
  const dashW = 26;
  for (let x = x0 + 24; x < x1 - 24; x += 64) {
    ctx.fillRect(x, y - 1, dashW, 3);
  }
  // Threshold bars at both ends.
  ctx.fillRect(x0 + 8, y - 3, 6, 8);
  ctx.fillRect(x1 - 14, y - 3, 6, 8);
  // Windsock beside the strip, fluttering with the wind.
  const wx = screenX(cam, r.x0 + 60);
  const wy = screenY(cam, r.alt);
  const flutter = Math.sin(time * 3) * 4;
  ctx.strokeStyle = '#3a3f45';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(wx, wy - 4);
  ctx.lineTo(wx, wy - 46);
  ctx.stroke();
  ctx.fillStyle = '#ff7a3d';
  ctx.beginPath();
  ctx.moveTo(wx, wy - 46);
  ctx.lineTo(wx + 34, wy - 40 + flutter);
  ctx.lineTo(wx, wy - 32);
  ctx.closePath();
  ctx.fill();
  // Label the strip.
  ctx.fillStyle = '#2e3440';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PINEFIELD', (x0 + x1) / 2, y + 30);
}

function drawDropTarget(ctx, terrain, cam, time) {
  const tx = screenX(cam, terrain.dropTargetX);
  if (tx < -80 || tx > VIEW.width + 80) return;
  const ty = screenY(cam, terrain.heightAt(terrain.dropTargetX));
  const pulse = 1 + Math.sin(time * 4) * 0.08;
  ctx.strokeStyle = COLOURS.ring;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(tx, ty - 2, 34 * pulse, 10 * pulse, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = COLOURS.ring;
  ctx.beginPath();
  ctx.arc(tx, ty - 2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#5a4510';
  ctx.fillText('DROP ZONE', tx, ty - 22);
}

function drawRings(ctx, terrain, cam, time) {
  for (const ring of terrain.rings) {
    const cx = screenX(cam, ring.x);
    if (cx < -80 || cx > VIEW.width + 80) continue;
    const cy = screenY(cam, ring.alt);
    const r = ring.radius * WORLD.pxPerMetre * 0.5;
    if (ring.passed) {
      ctx.strokeStyle = 'rgba(123,228,149,0.9)';
      ctx.lineWidth = 5;
    } else {
      ctx.strokeStyle = COLOURS.ringGlow;
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = COLOURS.ring;
      ctx.lineWidth = 5;
    }
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    // A small chevron above the next ring so the pilot can find it.
    if (!ring.passed) {
      const bob = Math.sin(time * 3 + ring.x) * 4;
      ctx.fillStyle = COLOURS.ring;
      ctx.beginPath();
      ctx.moveTo(cx, cy - r - 14 + bob);
      ctx.lineTo(cx - 9, cy - r - 26 + bob);
      ctx.lineTo(cx + 9, cy - r - 26 + bob);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawCrate(ctx, crate, cam) {
  if (!crate) return;
  const cx = screenX(cam, crate.x);
  const cy = screenY(cam, crate.alt);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(0.3);
  ctx.fillStyle = '#8a6a3b';
  ctx.fillRect(-9, -9, 18, 18);
  ctx.strokeStyle = '#5d4526';
  ctx.lineWidth = 2;
  ctx.strokeRect(-9, -9, 18, 18);
  ctx.beginPath();
  ctx.moveTo(-9, -9);
  ctx.lineTo(9, 9);
  ctx.moveTo(9, -9);
  ctx.lineTo(-9, 9);
  ctx.stroke();
  ctx.restore();
}

function drawPlane(ctx, plane, cam, time) {
  const px = screenX(cam, plane.x);
  const py = screenY(cam, plane.alt);

  ctx.save();
  ctx.translate(px, py);
  ctx.rotate((-plane.pitch * Math.PI) / 180);

  // Wing (far side, darker) and near wing.
  ctx.fillStyle = '#d8d2bd';
  ctx.beginPath();
  ctx.moveTo(-6, 2);
  ctx.lineTo(10, 2);
  ctx.lineTo(4, 12);
  ctx.lineTo(-12, 12);
  ctx.closePath();
  ctx.fill();

  // Fuselage.
  ctx.fillStyle = COLOURS.planeBody;
  ctx.beginPath();
  ctx.ellipse(0, 0, 34, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  // Tail.
  ctx.fillStyle = COLOURS.planeTrim;
  ctx.beginPath();
  ctx.moveTo(-30, -2);
  ctx.lineTo(-42, -16);
  ctx.lineTo(-36, -16);
  ctx.lineTo(-26, -4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = COLOURS.planeTrim;
  ctx.fillRect(-40, -4, 16, 4);
  // Cockpit glass.
  ctx.fillStyle = '#bfe3f2';
  ctx.beginPath();
  ctx.ellipse(10, -5, 9, 6, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLOURS.planeTrim;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Nose stripe and registration.
  ctx.fillStyle = COLOURS.planeWing;
  ctx.fillRect(18, -6, 8, 12);
  ctx.fillStyle = COLOURS.planeTrim;
  ctx.font = 'bold 8px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VR-7', -6, 3);

  // Wheels.
  ctx.fillStyle = '#22262b';
  ctx.beginPath();
  ctx.arc(-12, 12, 4, 0, Math.PI * 2);
  ctx.arc(12, 12, 4, 0, Math.PI * 2);
  ctx.fill();

  // Propeller: a blurred disc plus two blades at the current angle.
  const propX = 36;
  ctx.fillStyle = 'rgba(40,44,50,0.18)';
  ctx.beginPath();
  ctx.arc(propX, 0, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(propX, 0);
  ctx.rotate(plane.propAngle);
  ctx.fillStyle = 'rgba(30,32,36,0.85)';
  ctx.fillRect(-2, -16, 4, 32);
  ctx.restore();

  ctx.restore();
}

export function drawShadow(ctx, plane, terrain, cam) {
  const gx = screenX(cam, plane.x);
  const gy = screenY(cam, terrain.heightAt(plane.x));
  const heightAbove = Math.max(0, plane.alt - terrain.heightAt(plane.x));
  const alpha = Math.max(0.04, 0.28 - heightAbove * 0.0012);
  const w = Math.max(14, 46 - heightAbove * 0.06);
  ctx.fillStyle = `rgba(20,30,20,${alpha})`;
  ctx.beginPath();
  ctx.ellipse(gx, gy + 2, w, 5, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function renderWorld(ctx, game, time) {
  const { terrain, plane, cam, mission } = game;
  drawSky(ctx, cam, time);
  drawClouds(ctx, terrain, cam, time);
  drawGround(ctx, terrain, cam);
  drawTown(ctx, terrain, cam);
  drawRunway(ctx, terrain, cam, time);
  if (mission.kind === 'cargo') drawDropTarget(ctx, terrain, cam, time);
  if (mission.kind === 'rings') drawRings(ctx, terrain, cam, time);
  drawShadow(ctx, plane, terrain, cam);
  drawCrate(ctx, mission.crate, cam);
  drawPlane(ctx, plane, cam, time);
}
