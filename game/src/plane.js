// The aircraft: arcade flight physics with a stall, a fuel tank and
// a damage model. One step per frame; the function returns the
// events the frame produced (ring passed, touchdown, crash, ...)
// so the game layer, not the physics, decides what they mean.

import { PLANE, WORLD } from './config.js';

export function createPlane() {
  return {
    x: 120, // metres along the valley
    alt: 110, // metres above sea level
    vy: 0, // vertical speed, m/s (positive = climbing)
    speed: 55, // horizontal speed, m/s
    pitch: 0, // degrees, positive = nose up
    throttle: 0.62,
    fuel: PLANE.fuelCapacity,
    damage: 0, // 0..100, 100 = wrecked
    propAngle: 0,
    landed: false,
    crashed: false,
    outOfFuel: false,
  };
}

// `ctrl` is { pitch: -1..1, throttle: -1..1, action: bool }.
// `ground` is the terrain height under the plane this frame.
export function stepPlane(p, ctrl, dt, ground) {
  const events = [];

  if (p.landed || p.crashed) return events;

  // --- throttle and fuel -------------------------------------------
  p.throttle += ctrl.throttle * PLANE.throttleRate * dt;
  p.throttle = Math.max(0, Math.min(1, p.throttle));
  const burn = PLANE.fuelBurnIdle + (PLANE.fuelBurnFull - PLANE.fuelBurnIdle) * p.throttle;
  if (p.fuel > 0) {
    p.fuel = Math.max(0, p.fuel - burn * dt);
    if (p.fuel <= 0) {
      p.outOfFuel = true;
      events.push({ type: 'fuel-empty' });
    }
  }
  const thrust = p.outOfFuel ? 0 : p.throttle;

  // --- pitch --------------------------------------------------------
  p.pitch += ctrl.pitch * PLANE.pitchRate * dt;
  p.pitch = Math.max(PLANE.pitchMaxDown, Math.min(PLANE.pitchMaxUp, p.pitch));

  // --- speed: throttle pushes toward a target, drag pulls back ------
  const targetSpeed = PLANE.minSpeed + thrust * (PLANE.cruiseSpeed - PLANE.minSpeed + 18);
  const accel = targetSpeed > p.speed ? 9 : 13;
  p.speed += Math.max(-accel * dt, Math.min(accel * dt, targetSpeed - p.speed));
  // Climbing costs speed; diving buys it back.
  p.speed -= Math.sin((p.pitch * Math.PI) / 180) * 14 * dt;
  p.speed = Math.max(12, Math.min(PLANE.maxSpeed, p.speed));

  // --- vertical speed: lift follows pitch, stall kills it -----------
  const stalled = p.speed < PLANE.stallSpeed;
  const liftTarget = stalled
    ? -PLANE.sinkRate
    : (p.speed / PLANE.cruiseSpeed) * Math.sin((p.pitch * Math.PI) / 180) * PLANE.climbRate * 1.9;
  const vyRate = stalled ? 7 : 5.2;
  p.vy += Math.max(-vyRate * dt, Math.min(vyRate * dt, liftTarget - p.vy));
  if (stalled && events.length === 0) events.push({ type: 'stall' });

  // --- integrate ----------------------------------------------------
  p.x += p.speed * dt;
  p.alt += p.vy * dt;
  p.propAngle += (6 + thrust * 34) * dt;

  // --- the ground ---------------------------------------------------
  if (p.alt <= ground) {
    p.alt = ground;
    const impact = -p.vy;
    if (impact <= PLANE.safeTouchdown && p.speed < 70 && p.speed > 18) {
      p.landed = true;
      p.vy = 0;
      events.push({ type: 'landed', impact, speed: p.speed, onRunway: p.x >= WORLD.runwayX0 && p.x <= WORLD.runwayX1 });
    } else if (impact <= PLANE.hardTouchdown) {
      p.damage += 18 + impact * 4;
      p.vy = Math.abs(p.vy) * 0.25;
      p.speed *= 0.55;
      events.push({ type: 'bounce', impact, damage: p.damage });
      if (p.damage >= 100) {
        p.crashed = true;
        events.push({ type: 'crashed', reason: 'airframe gave out after a hard arrival' });
      }
    } else {
      p.crashed = true;
      events.push({ type: 'crashed', reason: impact > PLANE.crashSpeed ? 'hit the ground hard' : 'struck the terrain' });
    }
  }

  if (p.x > WORLD.worldEnd) {
    p.x = WORLD.worldEnd;
    p.speed = Math.max(20, p.speed * 0.98);
  }
  return events;
}

export function headingOf(p) {
  // Compass bearing of the velocity vector: 090 level east, lower
  // when climbing, higher when descending.
  const angle = Math.atan2(-p.vy, p.speed) * (180 / Math.PI);
  let hdg = 90 + angle;
  if (hdg < 0) hdg += 360;
  if (hdg >= 360) hdg -= 360;
  return hdg;
}
