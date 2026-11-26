// Missions: three sorties with different goals, each with its own
// scoring and its own end state. The game layer owns the mission
// state; the physics layer only reports what happened.

import { MISSIONS, SCORE, WORLD } from './config.js';

export function createMission(kind, terrain) {
  const def = MISSIONS.find((m) => m.id === kind) ?? MISSIONS[0];
  return {
    def,
    kind: def.id,
    ringsHit: 0,
    ringsTotal: terrain.rings.length,
    dropped: false,
    crate: null, // { x, alt, vy } once released
    dropError: null, // metres from the marker, once scored
    landing: null, // { impact, speed, onRunway } once down
    score: 0,
    done: false,
    doneReason: '',
    message: '',
    messageAt: 0,
  };
}

function setMessage(m, text, now) {
  m.message = text;
  m.messageAt = now;
}

// Called every frame while flying. Returns nothing; it mutates the
// mission and the plane's score, and plays sounds through `sfx`.
export function updateMission(m, plane, terrain, events, now, sfx, dt) {
  if (m.done) return;

  if (m.kind === 'rings') {
    for (const ring of terrain.rings) {
      if (ring.passed) continue;
      const dx = plane.x - ring.x;
      if (Math.abs(dx) < 14) {
        const dy = plane.alt - ring.alt;
        if (Math.abs(dy) < ring.radius) {
          ring.passed = true;
          m.ringsHit += 1;
          m.score += SCORE.ring;
          sfx.ring();
          setMessage(m, `Ring ${m.ringsHit} of ${m.ringsTotal} — +${SCORE.ring}`, now);
          if (m.ringsHit === m.ringsTotal) {
            m.done = true;
            m.doneReason = `All ${m.ringsTotal} rings threaded — clean run!`;
            sfx.fanfare();
          }
        } else if (dx > 0 && Math.abs(dx) < 16) {
          setMessage(m, `Missed the ring by ${Math.round(Math.abs(dy))} m`, now);
        }
      }
    }
  }

  if (m.kind === 'landing') {
    for (const e of events) {
      if (e.type === 'landed') {
        m.landing = e;
        if (e.onRunway) {
          const soft = Math.max(0, SCORE.landingSoft - Math.round(e.impact * 60));
          m.score += SCORE.landingBase + soft;
          m.done = true;
          m.doneReason = `Down on the strip at ${Math.round(e.speed)} m/s, touchdown ${e.impact.toFixed(1)} m/s.`;
          sfx.fanfare();
        } else {
          setMessage(m, 'That was a field, not the runway — keep flying to Pinefield', now);
        }
      }
    }
  }

  if (m.kind === 'cargo') {
    if (m.crate) {
      const c = m.crate;
      c.vy += 9.8 * dt;
      c.alt -= c.vy * dt;
      c.x += plane.speed * 0.55 * dt;
      const ground = terrain.heightAt(c.x);
      if (c.alt <= ground) {
        const err = Math.abs(c.x - terrain.dropTargetX);
        m.dropError = err;
        m.dropped = true;
        const points = Math.max(0, SCORE.dropBase - Math.round(err * 1.6));
        m.score += points;
        m.done = true;
        m.doneReason = err < 12
          ? `Bullseye! The crate landed ${err.toFixed(0)} m from the marker.`
          : `Crate down ${err.toFixed(0)} m from the marker.`;
        m.crate = null;
        sfx.fanfare();
      }
    }
  }

  // Shared: crashes and fuel-outs end the sortie, scored or not.
  for (const e of events) {
    if (e.type === 'crashed') {
      m.done = true;
      m.doneReason = `Crashed — ${e.reason}.`;
      sfx.crunch();
    }
    if (e.type === 'fuel-empty') setMessage(m, 'Fuel empty — glide her in!', now);
    if (e.type === 'bounce') {
      setMessage(m, `Hard arrival — airframe ${Math.round(e.damage)}% damaged`, now);
      sfx.thud();
    }
    if (e.type === 'landed') sfx.thud();
  }

  if (plane.x >= WORLD.worldEnd - 40 && !m.done) {
    m.done = true;
    m.doneReason = 'End of the valley — sortie over.';
    if (m.kind === 'rings') m.doneReason += ` ${m.ringsHit} of ${m.ringsTotal} rings.`;
  }
}

// Release the cargo crate from the plane (SPACE in the cargo mission).
export function dropCargo(m, plane) {
  if (m.kind !== 'cargo' || m.crate || m.done) return false;
  m.crate = { x: plane.x + 6, alt: plane.alt - 4, vy: 0 };
  return true;
}

// A tiny autopilot used by the ?shot= screenshot states: it steers
// the plane toward the next ring, the runway, or a level cruise.
export function autopilot(m, plane, terrain) {
  let targetAlt = 120;
  if (m.kind === 'rings') {
    const next = terrain.rings.find((r) => !r.passed && r.x > plane.x - 20);
    if (next) targetAlt = next.alt;
  } else if (m.kind === 'landing') {
    const d = terrain.runway.x0 - plane.x;
    targetAlt = d > 1200 ? 150 : Math.max(terrain.runway.alt + 8, 44 + (d / 1200) * 106);
  } else {
    targetAlt = 130;
  }
  const err = targetAlt - plane.alt;
  const pitch = Math.max(-1, Math.min(1, err / 30 - plane.vy * 0.1));
  const throttle = plane.speed < 55 ? 1 : plane.speed > 68 ? -1 : 0.2;
  return { pitch, throttle, action: false };
}
