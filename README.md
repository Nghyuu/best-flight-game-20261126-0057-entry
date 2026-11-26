[![Valley Run](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)
[![Rank](https://make.fun/badge/best-flight-game-20261126-0057/Nghyuu/best-flight-game-20261126-0057-entry/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)
[![Reward](https://make.fun/badge/best-flight-game-20261126-0057/Nghyuu/best-flight-game-20261126-0057-entry/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)

# Valley Run

A little red prop plane, a long green valley, three ways to fly it. A 2D canvas
flight game with no build step and no network requests — open `game/index.html`
in desktop Chrome and fly.

## How to fly

- **W / S** or **↑ / ↓** — pitch up / down
- **A / D** or **← / →** — throttle down / up
- **SPACE** — action (release the cargo crate)
- **Click-drag** — steer with the mouse (up/down pitches, left/right throttles)
- **P** pause · **R** restart · **M** mute

## The three missions

1. **Ring Run** — thread all six valley rings. Smooth throttle, gentle turns.
2. **Gentle Landing** — bring her down on the strip at Pinefield. A touchdown
   under 3 m/s of vertical speed on the runway scores best; a hard arrival
   damages the airframe.
3. **Cargo Drop** — release the supply crate over the meadow marker with SPACE.
   Scored on how close the crate lands to the marker.

Fuel burns with the throttle, so a sortie is a decision: push hard and arrive
fast, or nurse the tank and glide in. Fly too slow and she stalls; arrive too
hard and the airframe takes damage; hit the ground too fast and the flight is
over.

## What is on screen

Altitude, speed (knots) and heading on the HUD, a compass strip, an attitude
ball, and fuel / airframe / throttle bars. The valley below is procedural:
rolling hills, patchwork fields, a river, a little town, and the runway at
Pinefield with its windsock. Sounds are WebAudio oscillators only — an engine
drone that follows the throttle, a chime for each ring, a thud on touchdown.

## Screenshots

`?shot=1` flies the Ring Run, `?shot=2` is the title screen, `?shot=3` is the
final approach to Pinefield, `?shot=4` is a completed sortie. Each stages the
game's own code into that state (an autopilot flies shots 1 and 3) so the
screenshots are real renders of the game.

## Layout

```
game/
  index.html        the page (canvas + module entry)
  src/
    config.js       constants: world, plane, colours, missions
    rng.js          seeded random + 1D value noise
    terrain.js      procedural valley: hills, river, town, runway, rings
    plane.js        flight physics: lift, stall, fuel, damage
    input.js        keyboard + click-drag steering
    audio.js        WebAudio oscillator sounds
    missions.js     the three sorties, scoring, autopilot
    render.js       sky, terrain, runway, rings, the plane
    hud.js          instruments, compass, attitude, screens
    game.js         state machine, loop, screenshot staging
    main.js         boot
```

## Handing it in

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/`
beside itself to the output directory and writes `dossier.json` with
`buildDossier` from the kit's `vendor/makefun-game.ts`:

```
MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see `LICENSE`.
