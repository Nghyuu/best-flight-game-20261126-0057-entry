// HUD: the instruments the pilot flies by — altitude, speed and
// heading readouts, a compass strip, an attitude ball, fuel /
// damage / throttle bars and the score — plus the title, pause and
// end-of-sortie screens drawn over the world.

import { VIEW, COLOURS, MISSIONS } from './config.js';
import { headingOf } from './plane.js';

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = COLOURS.hudPanel;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function bar(ctx, x, y, w, h, frac, colour, label) {
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 4);
  ctx.fill();
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.roundRect(x, y, Math.max(0, w * Math.max(0, Math.min(1, frac))), h, 4);
  ctx.fill();
  ctx.fillStyle = COLOURS.hudText;
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(label, x, y - 5);
}

function compass(ctx, hdg) {
  const cx = VIEW.width / 2;
  const cy = 30;
  const w = 340;
  panel(ctx, cx - w / 2, cy - 16, w, 34);
  ctx.save();
  ctx.beginPath();
  ctx.rect(cx - w / 2, cy - 16, w, 34);
  ctx.clip();
  ctx.fillStyle = COLOURS.hudText;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  const points = [
    [0, 'N'], [45, 'NE'], [90, 'E'], [135, 'SE'],
    [180, 'S'], [225, 'SW'], [270, 'W'], [315, 'NW'],
  ];
  for (const [deg, label] of points) {
    let d = deg - hdg;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    const x = cx + d * 2.4;
    if (Math.abs(x - cx) > w / 2 - 8) continue;
    ctx.fillText(label, x, cy + 5);
    ctx.fillRect(x - 0.5, cy + 10, 1, 5);
  }
  ctx.restore();
  // Centre caret.
  ctx.fillStyle = COLOURS.hudAmber;
  ctx.beginPath();
  ctx.moveTo(cx, cy + 16);
  ctx.lineTo(cx - 6, cy + 24);
  ctx.lineTo(cx + 6, cy + 24);
  ctx.closePath();
  ctx.fill();
}

function attitude(ctx, plane, x, y, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  const pitchPx = (plane.pitch / 24) * r * 0.8;
  // Sky and ground halves, rotated by pitch.
  ctx.fillStyle = '#5d9ecf';
  ctx.fillRect(x - r, y - r + pitchPx, r * 2, r);
  ctx.fillStyle = '#8a6a3b';
  ctx.fillRect(x - r, y + pitchPx, r * 2, r);
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - r, y + pitchPx);
  ctx.lineTo(x + r, y + pitchPx);
  ctx.stroke();
  // Fixed aircraft symbol.
  ctx.strokeStyle = COLOURS.hudAmber;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 16, y);
  ctx.lineTo(x - 5, y);
  ctx.moveTo(x + 5, y);
  ctx.lineTo(x + 16, y);
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fillStyle = COLOURS.hudAmber;
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawHud(ctx, game) {
  const { plane, mission } = game;
  const hdg = headingOf(plane);

  // Top-left: the three big readouts.
  panel(ctx, 16, 14, 250, 86);
  ctx.textAlign = 'left';
  ctx.fillStyle = COLOURS.hudText;
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('ALT', 30, 34);
  ctx.fillText('SPD', 30, 58);
  ctx.fillText('HDG', 30, 82);
  ctx.font = 'bold 20px system-ui, monospace';
  ctx.fillText(`${Math.max(0, Math.round(plane.alt))} m`, 78, 37);
  ctx.fillText(`${Math.round(plane.speed * 1.94)} kt`, 78, 61);
  ctx.fillText(`${String(Math.round(hdg)).padStart(3, '0')}°`, 78, 85);
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(234,244,255,0.65)';
  ctx.fillText(`V/S ${plane.vy >= 0 ? '+' : ''}${plane.vy.toFixed(1)} m/s`, 178, 37);

  // Compass strip across the top centre.
  compass(ctx, hdg);

  // Top-right: score and objective.
  panel(ctx, VIEW.width - 276, 14, 260, 86);
  ctx.fillStyle = COLOURS.hudText;
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('SCORE', VIEW.width - 262, 34);
  ctx.font = 'bold 22px system-ui, monospace';
  ctx.fillStyle = COLOURS.hudAmber;
  ctx.fillText(String(mission.score), VIEW.width - 262, 60);
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(234,244,255,0.85)';
  const obj = mission.def.objective;
  ctx.fillText(obj.length > 40 ? obj.slice(0, 40) + '…' : obj, VIEW.width - 262, 84);

  // Bottom-left: fuel, damage, throttle.
  panel(ctx, 16, VIEW.height - 118, 250, 102);
  bar(ctx, 30, VIEW.height - 96, 222, 10, plane.fuel / 100, plane.fuel < 25 ? COLOURS.hudRed : COLOURS.hudGreen, `FUEL ${Math.round(plane.fuel)}%`);
  bar(ctx, 30, VIEW.height - 62, 222, 10, 1 - plane.damage / 100, plane.damage > 60 ? COLOURS.hudRed : COLOURS.hudGreen, `AIRFRAME ${100 - Math.round(plane.damage)}%`);
  bar(ctx, 30, VIEW.height - 28, 222, 10, plane.throttle, COLOURS.hudAmber, `THROTTLE ${Math.round(plane.throttle * 100)}%`);

  // Bottom-right: attitude ball.
  attitude(ctx, plane, VIEW.width - 70, VIEW.height - 66, 44);
  ctx.fillStyle = COLOURS.hudText;
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ATTITUDE', VIEW.width - 70, VIEW.height - 8);

  // Warnings.
  if (plane.speed < 32 && !plane.landed && !plane.crashed) {
    ctx.fillStyle = COLOURS.hudRed;
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    const blink = Math.floor(game.time * 3) % 2 === 0;
    if (blink) ctx.fillText('⚠ STALL — LOWER THE NOSE, ADD POWER', VIEW.width / 2, 130);
  }
  if (plane.outOfFuel && !plane.landed && !plane.crashed) {
    ctx.fillStyle = COLOURS.hudAmber;
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FUEL EMPTY — GLIDING', VIEW.width / 2, 130);
  }

  // Transient mission message.
  if (mission.message && game.time - mission.messageAt < 4) {
    ctx.fillStyle = 'rgba(12,26,40,0.72)';
    const tw = ctx.measureText(mission.message).width + 36;
    ctx.beginPath();
    ctx.roundRect(VIEW.width / 2 - tw / 2, 150, tw, 34, 10);
    ctx.fill();
    ctx.fillStyle = COLOURS.hudText;
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(mission.message, VIEW.width / 2, 172);
  }

  // Controls hint, bottom centre.
  ctx.fillStyle = 'rgba(234,244,255,0.75)';
  ctx.font = '12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('W/S pitch · A/D throttle · SPACE action · drag to steer · P pause · M mute', VIEW.width / 2, VIEW.height - 12);
}

function centredCard(ctx, title, lines, accent) {
  const w = 620;
  const h = 130 + lines.length * 30;
  const x = (VIEW.width - w) / 2;
  const y = (VIEW.height - h) / 2;
  ctx.fillStyle = 'rgba(10,22,34,0.82)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 16);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.fillText(title, VIEW.width / 2, y + 56);
  ctx.fillStyle = COLOURS.hudText;
  ctx.font = '16px system-ui, sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, VIEW.width / 2, y + 96 + i * 30));
}

export function drawTitle(ctx, selected) {
  ctx.fillStyle = 'rgba(8,20,34,0.45)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.fillText('VALLEY RUN', VIEW.width / 2, 190);
  ctx.fillStyle = COLOURS.hudAmber;
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText('A little red prop plane, a long green valley, three ways to fly it.', VIEW.width / 2, 228);
  MISSIONS.forEach((m, i) => {
    const y = 300 + i * 74;
    const active = i === selected;
    ctx.fillStyle = active ? 'rgba(255,207,61,0.22)' : 'rgba(12,26,40,0.6)';
    ctx.beginPath();
    ctx.roundRect(VIEW.width / 2 - 300, y - 28, 600, 58, 12);
    ctx.fill();
    if (active) {
      ctx.strokeStyle = COLOURS.hudAmber;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.fillStyle = active ? COLOURS.hudAmber : COLOURS.hudText;
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${m.key} — ${m.name}`, VIEW.width / 2 - 280, y - 4);
    ctx.fillStyle = 'rgba(234,244,255,0.85)';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText(m.blurb, VIEW.width / 2 - 280, y + 18);
  });
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Press 1, 2 or 3 to pick a mission — or Enter to fly the Ring Run.', VIEW.width / 2, 560);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('W/S pitch · A/D throttle · SPACE action · click-drag to steer', VIEW.width / 2, 590);
}

export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(8,20,34,0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  centredCard(ctx, 'PAUSED', ['Press P to keep flying.', 'R restarts the sortie.'], COLOURS.hudText);
}

export function drawEnd(ctx, game) {
  const { mission, plane } = game;
  const crashed = plane.crashed;
  const title = crashed ? 'CRASHED' : 'SORTIE COMPLETE';
  const accent = crashed ? COLOURS.hudRed : COLOURS.hudGreen;
  const lines = [
    mission.doneReason,
    `Score: ${mission.score}`,
    'Press R to fly again · T for the title screen',
  ];
  if (mission.kind === 'rings') lines.splice(1, 0, `Rings: ${mission.ringsHit} of ${mission.ringsTotal}`);
  if (mission.kind === 'cargo' && mission.dropError !== null) lines.splice(1, 0, `Drop error: ${mission.dropError.toFixed(0)} m`);
  if (mission.kind === 'landing' && mission.landing) lines.splice(1, 0, `Touchdown: ${mission.landing.impact.toFixed(1)} m/s at ${Math.round(mission.landing.speed)} m/s`);
  ctx.fillStyle = 'rgba(8,20,34,0.45)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  centredCard(ctx, title, lines, accent);
}
